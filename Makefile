COMPOSE=docker compose
COMPOSE_PRO=docker compose -f docker-compose-pro.yml
# HOST_IP ?= $(shell ip -4 route get 1.1.1.1 2>/dev/null | sed -n 's/.* src \([^ ]*\).*/\1/p' | head -n 1)
HOST_IP=192.168.10.154

ifeq ($(strip $(HOST_IP)),)
HOST_IP := $(shell hostname -I 2>/dev/null | awk '{print $$1}')
endif

define require_host_ip
	@test -n "$(HOST_IP)" || (echo "Could not detect the host machine IP. Set it explicitly, for example: make $@ HOST_IP=192.168.1.10" >&2; exit 1)
endef

.PHONY: build
build:
	$(COMPOSE) build backend

.PHONY: up
up:
	$(call require_host_ip)
	HOST_IP="$(HOST_IP)" $(COMPOSE) up -d backend

.PHONY: down
down:
	$(COMPOSE) stop backend

.PHONY: restart
restart:
	$(call require_host_ip)
	HOST_IP="$(HOST_IP)" $(COMPOSE) up -d --force-recreate backend

.PHONY: logs
logs:
	$(COMPOSE) logs -f backend

.PHONY: shell
shell:
	$(COMPOSE) exec backend sh

.PHONY: install
install:
	$(COMPOSE) exec backend npm install

.PHONY: dev
dev:
	$(call require_host_ip)
	HOST_IP="$(HOST_IP)" $(COMPOSE) up

.PHONY: up-pro
up-pro:
	$(call require_host_ip)
	HOST_IP="$(HOST_IP)" $(COMPOSE_PRO) up -d dana-backend

.PHONY: restart-pro
restart-pro:
	$(call require_host_ip)
	HOST_IP="$(HOST_IP)" $(COMPOSE_PRO) up -d --force-recreate dana-backend

.PHONY: logs-pro
logs-pro:
	$(COMPOSE_PRO) logs -f dana-backend
