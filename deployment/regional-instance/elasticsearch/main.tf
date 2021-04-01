terraform {
  required_version = ">= 0.13"

  required_providers {
    elasticsearch = {
      source  = "phillbaker/elasticsearch"
      version = "1.5.1"
    }
  }
}

resource "aws_elasticsearch_domain" "module_repository" {
  domain_name           = "module-repository-${var.region}"
  elasticsearch_version = "7.9"

  ebs_options {
    ebs_enabled = true
    volume_size = 10
  }

  cluster_config {
    instance_type = "t3.medium.elasticsearch"
  }

  tags = var.default_tags
}

locals {
  domain_url = "https://${aws_elasticsearch_domain.module_repository.endpoint}"
  index_name = "modules-${var.region}"
}

provider "elasticsearch" {
  url         = local.domain_url
  aws_profile = var.profile
}

resource "elasticsearch_index" "modules" {
  name               = local.index_name
  number_of_shards   = 1
  number_of_replicas = 1
  mappings           = file("./regional-instance/elasticsearch/mappings.json")
}