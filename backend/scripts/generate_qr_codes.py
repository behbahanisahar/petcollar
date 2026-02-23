#!/usr/bin/env python3
"""
Generate unique QR codes for pet collars (manufacturing/bulk print)

Usage:
  python generate_qr_codes.py --count 100 --output ./qr_codes
  python generate_qr_codes.py --count 50 --base-url https://myapp.com --output ./batch_001

Each QR encodes: {base_url}/p/{unique_id}
The unique_ids must be pre-registered in DB before collars ship.
Use seed_collars.py to add them to database.
"""
import argparse
import os
import secrets
import string
import asyncio
import sys

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import qrcode
from qrcode.constants import ERROR_CORRECT_M


def generate_unique_id(length: int = 12) -> str:
    """Generate URL-safe unique ID (alphanumeric)"""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def create_qr(url: str, output_path: str, size: int = 10):
    """Create QR code image and save to file"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=ERROR_CORRECT_M,
        box_size=size,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_path)


def main():
    parser = argparse.ArgumentParser(description="Generate unique QR codes for pet collars")
    parser.add_argument("--count", type=int, default=10, help="Number of QR codes to generate")
    parser.add_argument("--output", type=str, default="./qr_codes", help="Output directory")
    parser.add_argument(
        "--base-url",
        type=str,
        default="http://localhost:3000",
        help="Base URL (e.g. https://petcollar.ir)"
    )
    parser.add_argument("--seed-db", action="store_true", help="Also seed IDs into database")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    ids_file = os.path.join(args.output, "ids.txt")

    ids = []
    for i in range(args.count):
        uid = generate_unique_id()
        ids.append(uid)
        url = f"{args.base_url.rstrip('/')}/p/{uid}"
        img_path = os.path.join(args.output, f"{uid}.png")
        create_qr(url, img_path)
        print(f"Created: {uid}.png -> {url}")

    with open(ids_file, "w") as f:
        f.write("\n".join(ids))
    print(f"\nSaved {len(ids)} IDs to {ids_file}")

    if args.seed_db:
        asyncio.run(seed_database(ids))
        print("Database seeded with new collar IDs")


async def seed_database(ids: list[str]):
    """Add collar records to database for these IDs"""
    from database import Collar, async_session

    async with async_session() as session:
        for uid in ids:
            collar = Collar(unique_id=uid, is_claimed=False)
            session.add(collar)
        await session.commit()


if __name__ == "__main__":
    main()
