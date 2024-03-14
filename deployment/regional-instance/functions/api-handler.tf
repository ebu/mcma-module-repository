resource "aws_iam_role" "api_handler_role" {
  name               = "module-repository-api-handler-${var.region}-${var.environment_type}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy_doc.json
}

data "aws_iam_policy_document" "api_handler_s3_access_policy" {
  statement {
    effect  = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]
    resources = [
      "arn:aws:s3:::${var.module_staging_bucket.id}",
      "arn:aws:s3:::${var.module_bucket.id}"
    ]
  }
  statement {
    effect  = "Allow"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "arn:aws:s3:::${var.module_staging_bucket.id}/*",
      "arn:aws:s3:::${var.module_bucket.id}/*"
    ]
  }
  statement {
    effect  = "Allow"
    actions = [
      "s3:GetObject",
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
    effect  = "Allow"
    actions = [
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
  runtime          = "nodejs18.x"
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
      MCMA_TABLE_NAME              = var.table_name
    }
  }

  tags = var.default_tags
}

##########################
# API GATEWAY
##########################

resource "aws_api_gateway_rest_api" "module_repository_api" {
  name        = "module-repository-api-${var.region}-${var.environment_type}"
  description = "Module Repository REST API"
  tags        = var.default_tags

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

##########################
# OPTIONS (CORS)
##########################

resource "aws_api_gateway_resource" "module_repository_api_resource" {
  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id
  parent_id   = aws_api_gateway_rest_api.module_repository_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "module_repository_options_method" {
  rest_api_id   = aws_api_gateway_rest_api.module_repository_api.id
  resource_id   = aws_api_gateway_resource.module_repository_api_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "module_repository_options_200" {
  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id
  resource_id = aws_api_gateway_resource.module_repository_api_resource.id
  http_method = aws_api_gateway_method.module_repository_options_method.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "module_repository_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id
  resource_id = aws_api_gateway_resource.module_repository_api_resource.id
  http_method = aws_api_gateway_method.module_repository_options_method.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_integration_response" "module_repository_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id
  resource_id = aws_api_gateway_resource.module_repository_api_resource.id
  http_method = aws_api_gateway_method.module_repository_options_method.http_method
  status_code = aws_api_gateway_method_response.module_repository_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,PATCH,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
}

##########################
# GET (NO AUTH + CORS)
##########################

resource "aws_api_gateway_method" "module_repository_api_get_method" {
  rest_api_id   = aws_api_gateway_rest_api.module_repository_api.id
  resource_id   = aws_api_gateway_resource.module_repository_api_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "module_repository_get_200" {
  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id
  resource_id = aws_api_gateway_resource.module_repository_api_resource.id
  http_method = aws_api_gateway_method.module_repository_api_get_method.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "module_repository_api_get_method_integration" {
  rest_api_id             = aws_api_gateway_rest_api.module_repository_api.id
  resource_id             = aws_api_gateway_resource.module_repository_api_resource.id
  http_method             = aws_api_gateway_method.module_repository_api_get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_integration_response" "module_repository_get_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id
  resource_id = aws_api_gateway_resource.module_repository_api_resource.id
  http_method = aws_api_gateway_method.module_repository_api_get_method.http_method
  status_code = aws_api_gateway_method_response.module_repository_get_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,PATCH,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
}

##########################
# POST (AUTH)
##########################

resource "aws_api_gateway_authorizer" "user_pool_auth" {
  name          = "mcma-module-repository-authorizer-${var.region}-${var.environment_type}"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.module_repository_api.id
  provider_arns = [var.cognito_user_pool_arn]
}

resource "aws_api_gateway_method" "module_repository_api_method" {
  rest_api_id   = aws_api_gateway_rest_api.module_repository_api.id
  resource_id   = aws_api_gateway_resource.module_repository_api_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.user_pool_auth.id
}

resource "aws_api_gateway_integration" "module_repository_api_method_integration" {
  rest_api_id             = aws_api_gateway_rest_api.module_repository_api.id
  resource_id             = aws_api_gateway_resource.module_repository_api_resource.id
  http_method             = aws_api_gateway_method.module_repository_api_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_deployment" "module_repository_deployment" {
  depends_on = [
    aws_api_gateway_integration.module_repository_api_get_method_integration,
    aws_api_gateway_integration.module_repository_api_method_integration,
    aws_api_gateway_integration.module_repository_options_integration,
    aws_api_gateway_integration_response.module_repository_options_integration_response,
  ]

  rest_api_id = aws_api_gateway_rest_api.module_repository_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      filesha1("./regional-instance/functions/api-handler.tf"),
      filebase64sha256("../service/api-handler/build/dist/lambda.zip")
    ]))
  }
}

resource "aws_api_gateway_stage" "module_repository_api_stage" {
  depends_on = [
    aws_api_gateway_integration.module_repository_api_get_method_integration,
    aws_api_gateway_integration.module_repository_api_method_integration,
    aws_api_gateway_integration.module_repository_options_integration,
    aws_api_gateway_integration_response.module_repository_options_integration_response,
      aws_api_gateway_deployment.module_repository_deployment
  ]

  stage_name    = var.environment_type
  deployment_id = aws_api_gateway_deployment.module_repository_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.module_repository_api.id

  lifecycle {
    replace_triggered_by = [
      aws_api_gateway_deployment.module_repository_deployment
    ]
  }
}

resource "aws_lambda_permission" "module_repository_api_lambda_permission" {
  statement_id  = "AllowExecutionFromAPIGatewayDefault"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.module_repository_api.execution_arn}/*"
}

resource "aws_api_gateway_base_path_mapping" "regional_domain_name_mapping" {
  depends_on = [
    aws_api_gateway_stage.module_repository_api_stage
  ]

  api_id      = aws_api_gateway_rest_api.module_repository_api.id
  stage_name  = aws_api_gateway_stage.module_repository_api_stage.stage_name
  domain_name = local.regional_domain_name
  base_path   = "api"

  lifecycle {
    replace_triggered_by = [
      aws_api_gateway_stage.module_repository_api_stage
    ]
  }
}

resource "aws_api_gateway_base_path_mapping" "global_domain_name_mapping" {
  depends_on = [
    aws_api_gateway_stage.module_repository_api_stage
  ]

  api_id      = aws_api_gateway_rest_api.module_repository_api.id
  stage_name  = aws_api_gateway_stage.module_repository_api_stage.stage_name
  domain_name = local.global_domain_name
  base_path   = "api"

  lifecycle {
    replace_triggered_by = [
      aws_api_gateway_stage.module_repository_api_stage
    ]
  }
}