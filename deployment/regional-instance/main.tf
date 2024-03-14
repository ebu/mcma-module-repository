terraform {
  required_version = ">= 1.3.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.34.0"
    }
  }
}

module "dynamodb" {
  source = "./dynamodb"

  environment_type   = var.environment_type
  default_tags       = var.default_tags
}

module "buckets" {
  source = "./buckets"

  region             = var.region
  environment_type   = var.environment_type
  replication_region = var.replication_region
  default_tags       = var.default_tags
}

module "elasticsearch" {
  source = "./elasticsearch"

  profile          = var.profile
  region           = var.region
  environment_type = var.environment_type
  default_tags     = var.default_tags
}

module "cloudwatch" {
  source = "./cloudwatch"

  region           = var.region
  environment_type = var.environment_type
}

module "github_oidc" {
  source = "./github-oidc"

  environment_type = var.environment_type
  region           = var.region
  parent_domain    = var.parent_domain
  zone_id          = var.zone_id
  cert_arn         = var.cert_arn

  auth_subdomain        = var.auth_subdomain
  github_oidc_subdomain = var.github_oidc_subdomain
  github_client_id      = var.github_client_id
  github_client_secret  = var.github_client_secret

  default_tags = var.default_tags
}

module "auth" {
  source = "./auth"

  region           = var.region
  environment_type = var.environment_type
  parent_domain    = var.parent_domain
  zone_id          = var.zone_id
  cert_arn         = var.cert_arn
  cognito_cert_arn = var.auth_cert_arn

  auth_subdomain        = var.auth_subdomain
  github_oidc_subdomain = var.github_oidc_subdomain
  website_subdomain     = var.subdomain
  github_client_id      = var.github_client_id
  github_client_secret  = var.github_client_secret

  default_tags = var.default_tags
}

module "functions" {
  source = "./functions"

  region           = var.region
  environment_type = var.environment_type
  parent_domain    = var.parent_domain
  subdomain        = var.subdomain
  account_id       = var.account_id
  log_group        = var.log_group
  zone_id          = var.zone_id
  cert_arn         = var.cert_arn
  table_name       = var.table_name

  cognito_user_pool_arn           = module.auth.user_pool_arn
  module_bucket                   = module.buckets.module_bucket
  module_staging_bucket           = module.buckets.module_staging_bucket
  elastic_domain_arn              = module.elasticsearch.domain_arn
  elastic_endpoint                = module.elasticsearch.endpoint
  elastic_latest_versions_index   = module.elasticsearch.latest_versions_index_name
  elastic_previous_versions_index = module.elasticsearch.previous_versions_index_name

  default_tags = var.default_tags
}

module "website" {
  source = "./website"

  region           = var.region
  environment_type = var.environment_type
  log_group        = var.log_group
  parent_domain    = var.parent_domain
  subdomain        = var.subdomain

  auth_ws_api_arn = module.auth.auth_ws_api_arn
  auth_ws_domain  = module.auth.auth_ws_domain
  client_id       = module.auth.user_pool_client_id

  default_tags = var.default_tags
}

module "dns" {
  source = "./dns"

  region           = var.region
  environment_type = var.environment_type
  parent_domain    = var.parent_domain
  subdomain        = var.subdomain
  zone_id          = var.zone_id
  cert_arn         = var.cert_arn
}