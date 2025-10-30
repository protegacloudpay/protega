"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str | None = None  # Railway/Production DATABASE_URL
    postgres_user: str = "protega"
    postgres_password: str = "protega"
    postgres_db: str = "protega"
    postgres_host: str = "db"
    postgres_port: int = 5432

    # API
    api_port: int = 8000

    # Stripe
    stripe_secret_key: str
    stripe_publishable_key: str = ""

    # JWT
    jwt_secret: str
    jwt_expires_min: int = 43200  # 30 days
    jwt_algorithm: str = "HS256"

    # CORS
    frontend_url: str = "http://localhost:3000"  # Updated by production env

    # Environment
    env: str = "development"
    
    # Anti-fraud
    protega_device_enroll_limit: int = 3  # Per device per 24h
    protega_risk_otp_threshold: int = 30  # Score >= this -> require OTP
    protega_risk_kyc_threshold: int = 60  # Score >= this -> require KYC/manual review
    
    # Twilio (for OTP)
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )

    def get_database_url(self) -> str:
        """
        Get database connection URL.
        
        For Railway/production: Uses DATABASE_URL from environment
        For local development: Constructs from individual postgres_* settings
        """
        if self.database_url:
            # Railway/Production provides DATABASE_URL
            # Convert postgres:// to postgresql+psycopg:// if needed
            if self.database_url.startswith("postgres://"):
                return self.database_url.replace("postgres://", "postgresql+psycopg://", 1)
            elif self.database_url.startswith("postgresql://"):
                return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
            return self.database_url
        
        # Local development
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.env == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.env == "production"


settings = Settings()

