output "user_pool_arn" {
  value = aws_cognito_user_pool.users.arn
}
output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.client.id
}
output "auth_ws_api_arn" {
  value = aws_apigatewayv2_api.auth_ws.execution_arn
}
output "auth_ws_domain" {
  value = local.global_ws_domain_name
}