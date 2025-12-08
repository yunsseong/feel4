FROM alpine:3.19

# Install dependencies
RUN apk add --no-cache \
    restic \
    postgresql16-client \
    bash \
    tzdata \
    curl

# Set timezone
ENV TZ=Asia/Seoul

# Create backup directory
RUN mkdir -p /tmp/backup

# Copy backup script
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Setup cron job (runs at 3:00 AM daily)
RUN echo "0 3 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

# Create log file
RUN touch /var/log/backup.log

# Health check
HEALTHCHECK --interval=1h --timeout=10s --start-period=5s --retries=3 \
    CMD restic snapshots --last 1 || exit 1

# Run crond in foreground
CMD ["crond", "-f", "-l", "2"]
