resource "aws_iam_role" "api_handler_role" {
  name               = "module-repository-api-handler-${var.region}-role"
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
  name   = "module-repository-api-handler-${var.region}-s3-access"
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
  name = "module-repository-api-handler-${var.region}-es-access"
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
  function_name    = "module-repository-api-handler-${var.region}"
  role             = aws_iam_role.api_handler_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("../service/api-handler/build/dist/lambda.zip")
  runtime          = "nodejs12.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = {
      LogGroupName        = var.log_group
      ModuleBucket        = var.module_bucket.id
      ModuleStagingBucket = var.module_staging_bucket.id
      DefaultNamespace    = "ebu"
      ElasticEndpoint     = var.elastic_endpoint
      ElasticIndex        = var.elastic_index
      ElasticAuthType     = "AWS4"
      ElasticAuthContext  = "{ \"serviceName\": \"es\" }"
    }
  }

  tags = var.default_tags
}

resource "aws_api_gateway_rest_api" "module_repository_api" {
  name        = "module-repository-api-${var.region}"
  description = "Module Repository REST API"
}

resource "aws_api_gateway_resource" "module_repository_api_resource" {
  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id
  parent_id   = aws_api_gateway_rest_api.module_repository_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "module_repository_api_method" {
  rest_api_id   = aws_api_gateway_rest_api.module_repository_api.id
  resource_id   = aws_api_gateway_resource.module_repository_api_resource.id
  http_method   = "ANY"
  authorization = "AWS_IAM"
}

resource "aws_api_gateway_integration" "module_repository_api_method_integration" {
  rest_api_id             = aws_api_gateway_rest_api.module_repository_api.id
  resource_id             = aws_api_gateway_resource.module_repository_api_resource.id
  http_method             = aws_api_gateway_method.module_repository_api_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_lambda_permission" "module_repository_api_lambda_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${var.region}:${var.account_id}:${aws_api_gateway_rest_api.module_repository_api.id}/*/*/*"
}

resource "aws_api_gateway_deployment" "module_repository_api_deployment" {
  depends_on  = [aws_api_gateway_integration.module_repository_api_method_integration]
  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id
}

resource "aws_api_gateway_stage" "module_repository_api_gateway_stage" {
  stage_name    = "prod"
  deployment_id = aws_api_gateway_deployment.module_repository_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.module_repository_api.id

  tags = var.default_tags
}

resource "aws_api_gateway_method_settings" "module_repository_api_gateway_settings" {
  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id
  stage_name  = aws_api_gateway_stage.module_repository_api_gateway_stage.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "INFO"
  }
}