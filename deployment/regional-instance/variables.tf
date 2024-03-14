variable profile {
  type = string
}
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
variable auth_subdomain {
  type = string
}
variable github_oidc_subdomain {
  type = string
}
variable account_id {
  type = string
}
variable default_tags {
  type = map(string)
}
variable log_group {
  type = string
}
variable replication_region {
  type = string
}
variable zone_id {
  type = string
}
variable github_client_id {
  type      = string
  sensitive = true
}
variable github_client_secret {
  type      = string
  sensitive = true
}
variable cert_arn {
  type = string
}
variable auth_cert_arn {
  type = string
}
variable table_name {
  type = string
}