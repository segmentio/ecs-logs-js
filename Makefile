lint:
	@./node_modules/.bin/eslint ./lib/*.js

test:
	@./node_modules/.bin/mocha \
		--timeout 4s \
		--reporter spec \
		--bail

.PHONY: test lint
