variable profile {
  type    = string
  default = "ebu"
}

variable environment_type {
  type    = string
  default = "dev"
}

variable parent_domain {
  type    = string
  default = "mcma.io"
}

variable subdomain {
  type    = string
  default = "modules"
}

variable auth_subdomain {
  type    = string
  default = "auth"
}
variable github_oidc_subdomain {
  type    = string
  default = "github-oidc"
}

variable zone_name {
  type    = string
  default = "mcma.io"
}

variable github_client_id {
  type      = string
  sensitive = true
}
variable github_client_secret {
  type      = string
  sensitive = true
}