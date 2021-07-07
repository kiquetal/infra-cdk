#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { InfraCdkStack } from '../lib/infra-cdk-stack';
import { Utils } from '../lib/utils';

const app = new cdk.App();

Utils.createTagFromDefault(app);

new InfraCdkStack(app, 'InfraCdkStack');
