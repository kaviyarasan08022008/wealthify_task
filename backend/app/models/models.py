from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Investor(Base):
    __tablename__ = "investors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    pan_number = Column(String, index=True)

    # Relationships
    transactions = relationship("Transaction", back_populates="investor", cascade="all, delete-orphan")


class Fund(Base):
    __tablename__ = "funds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    amc_code = Column(String, nullable=True)
    scheme_type = Column(String, nullable=True)

    # Relationships
    transactions = relationship("Transaction", back_populates="fund", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    investor_id = Column(Integer, ForeignKey("investors.id", ondelete="CASCADE"), nullable=False)
    fund_id = Column(Integer, ForeignKey("funds.id", ondelete="CASCADE"), nullable=False)
    
    folio_no = Column(String, nullable=True)
    location = Column(String, nullable=True)
    tax_status = Column(String, nullable=True)
    
    transaction_date = Column(Date, index=True)
    amount = Column(Float)
    nav = Column(Float)
    units = Column(Float)

    # Relationships
    investor = relationship("Investor", back_populates="transactions")
    fund = relationship("Fund", back_populates="transactions")
