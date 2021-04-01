output "domain_arn" {
  value = aws_elasticsearch_domain.module_repository.arn
}

output "endpoint" {
  value = "https://${aws_elasticsearch_domain.module_repository.endpoint}"
}

output "index_name" {
  value = local.index_name
}