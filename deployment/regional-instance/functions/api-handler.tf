resource "aws_iam_role" "api_handler_role" {
  name               = "module-repository-api-handler-${var.region}-${var.environment_type}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy_doc.json
}

data "aws_iam_policy_document" "api_handler_s3_access_policy" {
  statement {
    effect    = "Allow"
    actions   = [
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${var.module_staging_bucket.id}",
      "arn:aws:s3:::${var.module_bucket.id}"
    ]
  }
  statement {
    effect    = "Allow"
    actions   = [
      "s3:GetObject"
    ]
    resources = [
      "arn:aws:s3:::${var.module_staging_bucket.id}/*",
      "arn:aws:s3:::${var.module_bucket.id}/*"
    ]
  }
  statement {
    effect    = "Allow"
    actions   = [
      "s3:PutObject"
    ]
    resources = [
      "arn:aws:s3:::${var.module_staging_bucket.id}/*"
    ]
  }
}

resource "aws_iam_policy" "api_handler_s3_access_policy" {
  name   = "module-repository-api-handler-${var.region}-${var.environment_type}-s3-access"
  policy = data.aws_iam_policy_document.api_handler_s3_access_policy.json
}

resource "aws_iam_role_policy_attachment" "api_handler_s3_policy_attachment" {
  role       = aws_iam_role.api_handler_role.name
  policy_arn = aws_iam_policy.api_handler_s3_access_policy.arn
}

data "aws_iam_policy_document" "api_handler_es_policy" {
  statement {
    effect    = "Allow"
    actions   = [
      "es:ESHttpGet",
      "es:ESHttpPost"
    ]
    resources = [
      "${var.elastic_domain_arn}/*"
    ]
  }
}

resource "aws_iam_policy" "api_handler_es_policy" {
  name   = "module-repository-api-handler-${var.region}-${var.environment_type}-es-access"
  policy = data.aws_iam_policy_document.api_handler_es_policy.json
}

resource "aws_iam_role_policy_attachment" "api_handler_es_policy_attachment" {
  role       = aws_iam_role.api_handler_role.name
  policy_arn = aws_iam_policy.api_handler_es_policy.arn
}

resource "aws_iam_role_policy_attachment" "api_handler_lambda_policy_attachment" {
  role       = aws_iam_role.api_handler_role.name
  policy_arn = aws_iam_policy.worker_lambda_access.arn
}

resource "aws_iam_role_policy_attachment" "api_handler_cloudwatch_policy_attachment" {
  role       = aws_iam_role.api_handler_role.name
  policy_arn = aws_iam_policy.lambda_cloudwatch_access.arn
}

resource "aws_lambda_function" "api_handler" {
  filename         = "../service/api-handler/build/dist/lambda.zip"
  function_name    = "module-repository-api-handler-${var.region}-${var.environment_type}"
  role             = aws_iam_role.api_handler_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("../service/api-handler/build/dist/lambda.zip")
  runtime          = "nodejs12.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = {
      ModulesBaseUrl               = local.modules_base_url
      LogGroupName                 = var.log_group
      ModuleBucket                 = var.module_bucket.id
      ModuleStagingBucket          = var.module_staging_bucket.id
      DefaultNamespace             = "ebu"
      ElasticEndpoint              = var.elastic_endpoint
      LatestVersionsElasticIndex   = var.elastic_latest_versions_index
      PreviousVersionsElasticIndex = var.elastic_previous_versions_index
      ElasticAuthType              = "AWS4"
      ElasticAuthContext           = "{ \"serviceName\": \"es\" }"
    }
  }

  tags = var.default_tags
}

##########################
# API GATEWAY
##########################

resource "aws_apigatewayv2_api" "module_repository_api" {
  name          = "module-repository-api-${var.region}-${var.environment_type}"
  description   = "Module Repository REST API"
  protocol_type = "HTTP"

  tags = var.default_tags
}

resource "aws_apigatewayv2_integration" "module_repository_api_integration" {
  api_id                 = aws_apigatewayv2_api.module_repository_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.api_handler.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "module_repository_api_route" {
  api_id             = aws_apigatewayv2_api.module_repository_api.id
  route_key          = "$default"
  authorization_type = "AWS_IAM"
  target             = "integrations/${aws_apigatewayv2_integration.module_repository_api_integration.id}"
}

resource "aws_lambda_permission" "module_repository_api_lambda_permission" {
  statement_id  = "AllowExecutionFromAPIGatewayDefault"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.module_repository_api.execution_arn}/*/$default"
}

resource "aws_apigatewayv2_stage" "module_repository_api_stage" {
  depends_on  = [aws_apigatewayv2_route.module_repository_api_route]
  api_id      = aws_apigatewayv2_api.module_repository_api.id
  name        = var.environment_type
  auto_deploy = true

  tags = var.default_tags
}

data "aws_acm_certificate" "ssl_cert" {
  domain = var.parent_domain
}

resource "aws_apigatewayv2_domain_name" "regional_domain_name" {
  domain_name = local.regional_domain_name

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.ssl_cert.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "regional_domain_name_mapping" {
  api_id          = aws_apigatewayv2_api.module_repository_api.id
  domain_name     = aws_apigatewayv2_domain_name.regional_domain_name.id
  stage           = aws_apigatewayv2_stage.module_repository_api_stage.id
  api_mapping_key = "api"
}

resource "aws_apigatewayv2_domain_name" "global_domain_name" {
  domain_name = local.global_domain_name

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.ssl_cert.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "global_domain_name_mapping" {
  api_id          = aws_apigatewayv2_api.module_repository_api.id
  domain_name     = aws_apigatewayv2_domain_name.global_domain_name.id
  stage           = aws_apigatewayv2_stage.module_repository_api_stage.id
  api_mapping_key = "api"
}

resource "aws_route53_record" "dns_record" {
  name    = aws_apigatewayv2_domain_name.regional_domain_name.domain_name
  type    = "A"
  zone_id = var.zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.regional_domain_name.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.regional_domain_name.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "modules" {
  name           = local.global_domain_name
  zone_id        = var.zone_id
  set_identifier = "${var.region}-${var.environment_type}"
  type           = "CNAME"
  ttl            = "300"
  records        = [local.regional_domain_name]

  latency_routing_policy {
    region = var.region
  }
}