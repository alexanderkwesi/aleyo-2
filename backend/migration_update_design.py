# migration_update_designs.py
from sqlalchemy import text
from database import engine, SessionLocal

def update_designs_table():
    db = SessionLocal()
    try:
        # Add new columns if they don't exist
        columns_to_add = [
            ("description", "TEXT"),
            ("image_url", "VARCHAR(500)"),
            ("rating", "FLOAT DEFAULT 4.5"),
            ("reviews", "INTEGER DEFAULT 0"),
            ("features", "JSON"),
            ("popular", "BOOLEAN DEFAULT FALSE"),
            ("icon", "VARCHAR(50) DEFAULT 'DesignServices'"),
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                db.execute(text(f"ALTER TABLE designs ADD COLUMN {col_name} {col_type}"))
                print(f"Added column: {col_name}")
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    print(f"Column {col_name} already exists, skipping...")
                else:
                    print(f"Error adding {col_name}: {e}")
        
        db.commit()
        print("Designs table updated successfully!")
    except Exception as e:
        print(f"Error updating designs table: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_designs_table()