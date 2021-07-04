#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { InfraCdkStack } from '../lib/infra-cdk-stack';

const app = new cdk.App();

new InfraCdkStack(app, 'InfraCdkStack');
