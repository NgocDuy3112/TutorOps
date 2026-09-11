FROM postgres:17-alpine

RUN apk add --no-cache aws-cli

COPY backup/backup.sh /usr/local/bin/backup.sh
COPY backup/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
