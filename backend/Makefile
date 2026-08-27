.PHONY: install up down seed run-demo test dev

install:
	pip install -r requirements.txt

up:
	docker-compose up -d

down:
	docker-compose down

seed:
	python scripts/seed_demo.py

run-demo:
	python scripts/run_demo.py

test:
	pytest

dev:
	uvicorn app.main:app --reload
