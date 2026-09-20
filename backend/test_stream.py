import asyncio
import logging
import sys
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
from app.services.demo_stream_manager import demo_manager

async def main():
    demo_manager.start()
    await asyncio.sleep(5)
    demo_manager.stop()

if __name__ == '__main__':
    asyncio.run(main())
