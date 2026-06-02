from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mutual Fund Transaction Dashboard API"
    # DATABASE_URL: str = "postgresql://postgres:AcademyRootPassword@localhost:5432/wealthify"
    DATABASE_URL: str = "postgresql://postgres.rtiqikmuwaprkfauinhk:kaviyarasan%40123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
    class Config:
        env_file = ".env"

settings = Settings()
