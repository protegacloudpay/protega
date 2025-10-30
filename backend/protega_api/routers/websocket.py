"""WebSocket endpoints for real-time updates."""

import json
import logging
from typing import List
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from protega_api.db import get_db
from protega_api.schemas import RealTimeTransactionEvent

router = APIRouter()
logger = logging.getLogger(__name__)

# Connection manager for WebSocket clients
class ConnectionManager:
    def __init__(self):
        # Dictionary to store active connections by merchant_id
        self.active_connections: dict[int, List[WebSocket]] = {}
        # Dictionary to store connections by charge_id (for customer views)
        self.charge_connections: dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, merchant_id: int):
        """Accept a new WebSocket connection for a merchant."""
        await websocket.accept()
        if merchant_id not in self.active_connections:
            self.active_connections[merchant_id] = []
        self.active_connections[merchant_id].append(websocket)
        logger.info(f"WebSocket connected for merchant {merchant_id}")
    
    async def connect_to_charge(self, websocket: WebSocket, charge_id: str):
        """Accept a new WebSocket connection for a customer viewing a charge."""
        await websocket.accept()
        if charge_id not in self.charge_connections:
            self.charge_connections[charge_id] = []
        self.charge_connections[charge_id].append(websocket)
        logger.info(f"WebSocket connected for charge {charge_id}")
    
    def disconnect(self, websocket: WebSocket, merchant_id: int):
        """Remove a WebSocket connection."""
        if merchant_id in self.active_connections:
            self.active_connections[merchant_id].remove(websocket)
            if not self.active_connections[merchant_id]:
                del self.active_connections[merchant_id]
        logger.info(f"WebSocket disconnected for merchant {merchant_id}")
    
    def disconnect_from_charge(self, websocket: WebSocket, charge_id: str):
        """Remove a WebSocket connection for a charge."""
        if charge_id in self.charge_connections:
            self.charge_connections[charge_id].remove(websocket)
            if not self.charge_connections[charge_id]:
                del self.charge_connections[charge_id]
        logger.info(f"WebSocket disconnected for charge {charge_id}")
    
    async def send_to_merchant(self, merchant_id: int, message: dict):
        """Send a message to all connections for a merchant."""
        if merchant_id in self.active_connections:
            for connection in self.active_connections[merchant_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to merchant {merchant_id}: {e}")
    
    async def send_to_charge(self, charge_id: str, message: dict):
        """Send a message to all customer connections viewing a charge."""
        if charge_id in self.charge_connections:
            for connection in self.charge_connections[charge_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to charge {charge_id}: {e}")

# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws/merchant/{merchant_id}")
async def websocket_merchant_updates(websocket: WebSocket, merchant_id: int):
    """
    WebSocket endpoint for real-time merchant updates.
    
    Subscribes to:
    - New transactions
    - Fee distributions
    - Balance updates
    - System notifications
    """
    await manager.connect(websocket, merchant_id)
    
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            logger.info(f"Received from merchant {merchant_id}: {data}")
            
            # Echo back for heartbeat/ping
            await websocket.send_json({"type": "pong", "data": data})
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, merchant_id)
        logger.info(f"Merchant {merchant_id} disconnected")


async def broadcast_transaction_event(
    merchant_id: int,
    transaction_id: int,
    amount_cents: int,
    event_type: str = "transaction_created"
):
    """
    Broadcast a transaction event to all WebSocket connections for a merchant.
    
    Called from other routers when transactions complete.
    """
    event = RealTimeTransactionEvent(
        event_type=event_type,
        transaction_id=transaction_id,
        amount_cents=amount_cents,
        merchant_id=merchant_id,
        timestamp=datetime.utcnow()
    )
    
    await manager.send_to_merchant(
        merchant_id,
        event.model_dump()
    )
    
    logger.info(f"Broadcast {event_type} event to merchant {merchant_id}")


@router.websocket("/ws/charge/{charge_id}")
async def websocket_charge_updates(websocket: WebSocket, charge_id: str):
    """
    WebSocket endpoint for real-time charge updates.
    
    Customers connect here to receive live updates when merchant changes amount/description.
    """
    await manager.connect_to_charge(websocket, charge_id)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            logger.info(f"Received from charge {charge_id}: {data}")
            
            # Echo back for heartbeat
            await websocket.send_json({"type": "pong", "data": data})
            
    except WebSocketDisconnect:
        manager.disconnect_from_charge(websocket, charge_id)
        logger.info(f"Charge {charge_id} disconnected")


async def broadcast_charge_update(charge_id: str, update_data: dict):
    """
    Broadcast charge updates to all customer connections viewing this charge.
    
    Called when merchant updates the amount or description.
    """
    message = {
        "type": "charge_update",
        "charge_id": charge_id,
        "data": update_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await manager.send_to_charge(charge_id, message)
    logger.info(f"Broadcast charge update for {charge_id}: {update_data}")

