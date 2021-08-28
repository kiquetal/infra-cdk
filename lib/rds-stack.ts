import * as cdk from "@aws-cdk/core";
import * as ec2 from '@aws-cdk/aws-ec2';

import * as rds from '@aws-cdk/aws-rds';
import {SecretValue} from "@aws-cdk/core";

interface Rds extends cdk.StackProps {
    vpc:ec2.Vpc,
    sg:ec2.SecurityGroup
}


export class RdsCdkStack extends cdk.Stack {

    private readonly vpc:ec2.Vpc ;
    private readonly sg:ec2.SecurityGroup | undefined;
    constructor(scope: cdk.Construct, id: string, props?: Rds) {
        super(scope, id, props);
        // @ts-ignore
        this.vpc = props.vpc;
        // @ts-ignore
        this.sg = props.sg;

        const dbInstance = new rds.DatabaseInstance(this, 'db-tigosports', {
            vpc: this.vpc,
            vpcSubnets: {
                subnetGroupName: 'rds-subnet'
            },
            instanceIdentifier: 'tigosports-vpc',
            engine: rds.DatabaseInstanceEngine.mysql({
                version: rds.MysqlEngineVersion.VER_5_7
            }),
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            //@ts-ignore
            credentials: rds.Credentials.fromPassword('dbuser', SecretValue.ssmSecure('/db/password', 1)),
            databaseName: 'tigosports',
            multiAz: true,
            storageEncrypted: true,
            securityGroups: [this.sg],

        });

    }
}
