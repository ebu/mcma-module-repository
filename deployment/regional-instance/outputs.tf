output api_endpoint {
  value = module.functions.api_endpoint
}

output module_staging_bucket {
  value = module.buckets.module_staging_bucket.id
}