#!/bin/bash

cat ./mysql/init.sql | docker-compose exec -T mysql mysql --user=reversi --password=password reversi