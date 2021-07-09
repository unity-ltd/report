#!/bin/bash

DATE=$(date +\%F)
FILE_NAME="house_report_${DATE}.sql"
S3_BUCKET="s3://unityproperty-sysdata/database/"

/usr/bin/mysqldump --defaults-extra-file=/home/ubuntu/.mylogin.cnf -u house --single-transaction --quick --lock-tables=false house_report  > /tmp/${FILE_NAME}

/usr/bin/aws s3 cp /tmp/${FILE_NAME} ${S3_BUCKET}

rm /tmp/${FILE_NAME}
