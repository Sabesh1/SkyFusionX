from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseIngestionAdapter(ABC):
    """
    Abstract base class for all ingestion adapters.
    Each adapter must implement fetch() and normalize().
    """

    @abstractmethod
    async def fetch(self) -> List[Dict[str, Any]]:
        """
        Fetch raw data from the external source.
        Returns a list of raw data dictionaries.
        """
        pass

    @abstractmethod
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a raw data dictionary into the standard Observation format.
        Must return a dict compatible with the Observation schema.
        """
        pass

    async def ingest(self) -> List[Dict[str, Any]]:
        """
        Fetch and normalize all data.
        """
        raw_items = await self.fetch()
        normalized_items = []
        for item in raw_items:
            try:
                normalized = self.normalize(item)
                if normalized:
                    normalized_items.append(normalized)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error normalizing item: {e}")
        return normalized_items
