terraform {
  required_version = ">= 0.13"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.26"
    }
  }
}

provider "aws" {
  profile = var.profile
  region  = var.region
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

module "functions" {
  source = "./functions"

  region           = var.region
  environment_type = var.environment_type
  parent_domain    = var.parent_domain
  subdomain        = var.subdomain
  account_id       = var.account_id
  log_group        = var.log_group
  default_tags     = var.default_tags
  zone_id          = var.zone_id

  module_bucket                   = module.buckets.module_bucket
  module_staging_bucket           = module.buckets.module_staging_bucket
  elastic_domain_arn              = module.elasticsearch.domain_arn
  elastic_endpoint                = module.elasticsearch.endpoint
  elastic_latest_versions_index   = module.elasticsearch.latest_versions_index_name
  elastic_previous_versions_index = module.elasticsearch.previous_versions_index_name
}