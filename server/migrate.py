"""
Simple migration runner for PostgreSQL.

Usage:
  Set DATABASE_URL=postgresql://user:pass@host:5432/dbname
  python -m server.migrate apply  # applies 001_init_postgres.sql
"""
import os
import sys

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), 'migrations')
INIT_SQL = os.path.join(MIGRATIONS_DIR, '001_init_postgres.sql')


def apply_init_sql():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print('[migrate] DATABASE_URL not set. Aborting.')
        sys.exit(1)

    try:
        import psycopg2
    except ImportError:
        print('[migrate] psycopg2 not installed. Please install it to run migrations.')
        sys.exit(1)

    with open(INIT_SQL, 'r', encoding='utf-8') as f:
        sql = f.read()

    print('[migrate] Connecting to PostgreSQL...')
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        print('[migrate] Migration applied successfully.')
    finally:
        conn.close()


def main():
    if len(sys.argv) < 2:
        print('Usage: python -m server.migrate apply')
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == 'apply':
        apply_init_sql()
    else:
        print(f'Unknown command: {cmd}')
        sys.exit(1)


if __name__ == '__main__':
    main()
