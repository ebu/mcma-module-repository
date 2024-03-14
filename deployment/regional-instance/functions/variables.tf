variable region {
  type = string
}
variable environment_type {
  type = string
}
variable parent_domain {
  type = string
}
variable subdomain {
  type = string
}
variable account_id {
  type = string
}
variable log_group {
  type = string
}
variable default_tags {
  type = map(string)
}
variable module_bucket {
  type = object({
    id  = string
    arn = string
  })
}
variable module_staging_bucket {
  type = object({
    id  = string
    arn = string
  })
}
variable elastic_domain_arn {
  type = string
}
variable elastic_endpoint {
  type = string
}
variable elastic_latest_versions_index {
  type = string
}
variable elastic_previous_versions_index {
  type = string
}
variable zone_id {
  type = string
}
variable cert_arn {
  type = string
}
variable cognito_user_pool_arn {
  type = string
}
variable table_name {
  type = string
}