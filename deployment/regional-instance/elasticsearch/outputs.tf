output "domain_arn" {
  value = aws_elasticsearch_domain.module_repository.arn
}

output "endpoint" {
  value = "https://${aws_elasticsearch_domain.module_repository.endpoint}"
}

output "latest_versions_index_name" {
  value = local.latest_versions_index_name
}

output "previous_versions_index_name" {
  value = local.previous_versions_index_name
}