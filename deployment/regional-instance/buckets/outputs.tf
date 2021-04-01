output module_bucket {
  value = aws_s3_bucket.modules_bucket
}

output module_staging_bucket {
  value = aws_s3_bucket.modules_staging_bucket
}