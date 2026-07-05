# add_design_columns.py
from database import engine
from sqlalchemy import text

def add_design_columns():
    with engine.connect() as conn:
        # Check and add columns if they don't exist
        conn.execute(text("ALTER TABLE designs ADD COLUMN description TEXT"))
        conn.execute(text("ALTER TABLE designs ADD COLUMN image_url TEXT"))
        conn.execute(text("ALTER TABLE designs ADD COLUMN rating FLOAT DEFAULT 4.5"))
        conn.execute(text("ALTER TABLE designs ADD COLUMN reviews INTEGER DEFAULT 0"))
        conn.execute(text("ALTER TABLE designs ADD COLUMN features JSON"))
        conn.execute(text("ALTER TABLE designs ADD COLUMN popular BOOLEAN DEFAULT 0"))
        conn.execute(text("ALTER TABLE designs ADD COLUMN icon TEXT DEFAULT 'DesignServices'"))
        conn.commit()
        print("Columns added successfully!")

if __name__ == "__main__":
    add_design_columns()