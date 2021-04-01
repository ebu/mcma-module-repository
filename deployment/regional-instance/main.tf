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
  replication_region = var.replication_region
  default_tags       = var.default_tags
}

module "elasticsearch" {
  source = "./elasticsearch"

  profile      = var.profile
  region       = var.region
  default_tags = var.default_tags
}

module "cloudwatch" {
  source = "./cloudwatch"

  region = var.region
}

module "functions" {
  source = "./functions"

  region                = var.region
  account_id            = var.account_id
  log_group             = var.log_group
  default_tags          = var.default_tags
  module_bucket         = module.buckets.module_bucket
  module_staging_bucket = module.buckets.module_staging_bucket
  elastic_domain_arn    = module.elasticsearch.domain_arn
  elastic_endpoint      = module.elasticsearch.endpoint
  elastic_index         = module.elasticsearch.index_name
}