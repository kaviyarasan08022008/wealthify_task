from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mutual Fund Transaction Dashboard API"
    DATABASE_URL: str = "postgresql://postgres:AcademyRootPassword@localhost:5432/wealthify"

    class Config:
        env_file = ".env"

settings = Settings()
