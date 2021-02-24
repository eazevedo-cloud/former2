/* ========================================================================== */
// ECR
/* ========================================================================== */

sections.push({
    'category': 'Containers',
    'service': 'ECR',
    'resourcetypes': {
        'Repositories': {
            'columns': [
                [
                    {
                        field: 'state',
                        checkbox: true,
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle'
                    },
                    {
                        title: 'Name',
                        field: 'name',
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle',
                        sortable: true,
                        formatter: primaryFieldFormatter,
                        footerFormatter: textFormatter
                    },
                    {
                        title: 'Properties',
                        colspan: 4,
                        align: 'center'
                    }
                ],
                [
                    {
                        field: 'uri',
                        title: 'Repository URI',
                        sortable: true,
                        editable: true,
                        footerFormatter: textFormatter,
                        align: 'center'
                    },
                    {
                        field: 'createdat',
                        title: 'Created At',
                        sortable: true,
                        editable: true,
                        formatter: dateFormatter,
                        footerFormatter: textFormatter,
                        align: 'center'
                    }
                ]
            ]
        },
        'Public Repositories': {
            'columns': [
                [
                    {
                        field: 'state',
                        checkbox: true,
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle'
                    },
                    {
                        title: 'Name',
                        field: 'name',
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle',
                        sortable: true,
                        formatter: primaryFieldFormatter,
                        footerFormatter: textFormatter
                    },
                    {
                        title: 'Properties',
                        colspan: 4,
                        align: 'center'
                    }
                ],
                [
                    {
                        field: 'uri',
                        title: 'Repository URI',
                        sortable: true,
                        editable: true,
                        footerFormatter: textFormatter,
                        align: 'center'
                    },
                    {
                        field: 'createdat',
                        title: 'Created At',
                        sortable: true,
                        editable: true,
                        formatter: dateFormatter,
                        footerFormatter: textFormatter,
                        align: 'center'
                    }
                ]
            ]
        },
        'Replication Configuration': {
            'columns': [
                [
                    {
                        field: 'state',
                        checkbox: true,
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle'
                    },
                    {
                        title: 'Registry ID',
                        field: 'registryid',
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle',
                        sortable: true,
                        formatter: primaryFieldFormatter,
                        footerFormatter: textFormatter
                    }
                ],
                [
                    // nothing
                ]
            ]
        }
    }
});

async function updateDatatableContainersECR() {
    blockUI('#section-containers-ecr-repositories-datatable');
    blockUI('#section-containers-ecr-publicrepositories-datatable');
    blockUI('#section-containers-ecr-replicationconfiguration-datatable');

    await sdkcall("ECR", "describeRepositories", {
        // no params
    }, true).then(async (data) => {
        $('#section-containers-ecr-repositories-datatable').deferredBootstrapTable('removeAll');

        await Promise.all(data.repositories.map(async (repository) => {
            await sdkcall("ECR", "getLifecyclePolicy", {
                repositoryName: repository.repositoryName
            }, false).then(async (data) => {
                repository['lifecyclePolicyText'] = data.lifecyclePolicyText;
                repository['registryId'] = data.registryId;
                await sdkcall("ECR", "getRepositoryPolicy", {
                    repositoryName: repository.repositoryName
                }, true).then((data) => {
                    repository['policy'] = data.policyText;

                }).catch(() => { });
            }).catch(() => { });

            repository['Tags'] = await getResourceTags(repository.repositoryArn);

            $('#section-containers-ecr-repositories-datatable').deferredBootstrapTable('append', [{
                f2id: repository.repositoryArn,
                f2type: 'ecr.repository',
                f2data: repository,
                f2region: region,
                f2link: 'https://console.aws.amazon.com/ecr/repositories/' + repository.repositoryName + '/',
                name: repository.repositoryName,
                uri: repository.repositoryUri,
                createdat: repository.createdAt
            }]);

            return Promise.resolve();
        }));

        unblockUI('#section-containers-ecr-repositories-datatable');
    });

    await sdkcall("ECRPUBLIC", "describeRepositories", {
        // no params
    }, true).then(async (data) => {
        $('#section-containers-ecr-publicrepositories-datatable').deferredBootstrapTable('removeAll');

        await Promise.all(data.repositories.map(async (repository) => {
            await sdkcall("ECRPUBLIC", "getRepositoryPolicy", {
                repositoryName: repository.repositoryName
            }, false).then((data) => {
                repository['policy'] = data.policyText;
            }).catch(() => { });

            await sdkcall("ECRPUBLIC", "getRepositoryCatalogData", {
                repositoryName: repository.repositoryName
            }, false).then((data) => {
                repository['catalogData'] = data.catalogData;
            }).catch(() => { });

            $('#section-containers-ecr-publicrepositories-datatable').deferredBootstrapTable('append', [{
                f2id: repository.repositoryArn,
                f2type: 'ecr.publicrepository',
                f2data: repository,
                f2region: region,
                name: repository.repositoryName,
                uri: repository.repositoryUri,
                createdat: repository.createdAt
            }]);

            return Promise.resolve();
        }));

        unblockUI('#section-containers-ecr-publicrepositories-datatable');
    });

    await sdkcall("ECR", "describeRegistry", {
        // no params
    }, true).then(async (data) => {
        $('#section-containers-ecr-replicationconfiguration-datatable').deferredBootstrapTable('removeAll');

        if (data.replicationConfiguration && data.replicationConfiguration.rules && data.replicationConfiguration.rules.length > 0) {
            data.replicationConfiguration['registryId'] = data.registryId;

            $('#section-containers-ecr-replicationconfiguration-datatable').deferredBootstrapTable('append', [{
                f2id: data.registryId + " Replication Configuration",
                f2type: 'ecr.replicationconfiguration',
                f2data: data.replicationConfiguration,
                f2region: region,
                registryid: data.registryId
            }]);
        }

        unblockUI('#section-containers-ecr-replicationconfiguration-datatable');
    }).catch(() => { });
}

service_mapping_functions.push(function(reqParams, obj, tracked_resources){
    if (obj.type == "ecr.repository") {
        reqParams.cfn['RepositoryName'] = obj.data.repositoryName;
        reqParams.tf['name'] = obj.data.repositoryName;
        reqParams.cfn['LifecyclePolicy'] = {
            'LifecyclePolicyText': obj.data.lifecyclePolicyText,
            'RegistryId': obj.data.registryId
        };
        reqParams.cfn['RepositoryPolicyText'] = obj.data.policy;
        reqParams.cfn['Tags'] = obj.data.Tags;

        tracked_resources.push({
            'obj': obj,
            'logicalId': getResourceName('ecr', obj.id, 'AWS::ECR::Repository'),
            'region': obj.region,
            'service': 'ecr',
            'type': 'AWS::ECR::Repository',
            'terraformType': 'aws_ecr_repository',
            'options': reqParams
        });

        if (obj.data.policy) {
            reqParams = {
                'boto3': {},
                'go': {},
                'cfn': {},
                'cli': {},
                'tf': {},
                'iam': {}
            };

            reqParams.tf['repository'] = obj.data.repositoryName;
            reqParams.tf['policy'] = obj.data.policy;

            tracked_resources.push({
                'obj': obj,
                'logicalId': getResourceName('ecr', obj.id, 'AWS::ECR::RepositoryPolicy'), // not real resource type
                'region': obj.region,
                'service': 'ecr',
                'terraformType': 'aws_ecr_repository_policy',
                'options': reqParams
            });
        }

        if (obj.data.lifecyclePolicyText) {
            reqParams = {
                'boto3': {},
                'go': {},
                'cfn': {},
                'cli': {},
                'tf': {},
                'iam': {}
            };

            reqParams.tf['repository'] = obj.data.repositoryName;
            reqParams.tf['policy'] = obj.data.lifecyclePolicyText;

            tracked_resources.push({
                'obj': obj,
                'logicalId': getResourceName('ecr', obj.id, 'AWS::ECR::LifecyclePolicy'), // not real resource type
                'region': obj.region,
                'service': 'ecr',
                'terraformType': 'aws_ecr_lifecycle_policy',
                'options': reqParams
            });
        }
    } else if (obj.type == "ecr.publicrepository") {
        reqParams.cfn['RepositoryName'] = obj.data.repositoryName;
        reqParams.cfn['RepositoryPolicyText'] = obj.data.policy;
        if (obj.data.catalogData) {
            reqParams.cfn['RepositoryCatalogData'] = {
                'UsageText': obj.data.catalogData.usageText,
                'AboutText': obj.data.catalogData.aboutText,
                'OperatingSystems': obj.data.catalogData.operatingSystems,
                'Architectures': obj.data.catalogData.architectures,
                'RepositoryDescription': obj.data.catalogData.repositoryDescription
            };
        }

        tracked_resources.push({
            'obj': obj,
            'logicalId': getResourceName('ecr', obj.id, 'AWS::ECR::PublicRepository'),
            'region': obj.region,
            'service': 'ecr',
            'type': 'AWS::ECR::PublicRepository',
            'options': reqParams
        });
    } else if (obj.type == "ecr.replicationconfiguration") {
        var rules = [];

        obj.data.rules.forEach(rule => {
            var destinations = [];

            rule.destinations.forEach(destination => {
                destinations.push({
                    'Region': destination.region,
                    'RegistryId': destination.registryId
                });
            });

            rules.push({
                'Destinations': destinations
            });
        });

        reqParams.cfn['ReplicationConfiguration'] = {
            'Rules': rules
        };

        tracked_resources.push({
            'obj': obj,
            'logicalId': getResourceName('ecr', obj.id, 'AWS::ECR::ReplicationConfiguration'),
            'region': obj.region,
            'service': 'ecr',
            'type': 'AWS::ECR::ReplicationConfiguration',
            'options': reqParams,
            'returnValues': {
                'Import': {
                    'RegistryId': obj.data.registryId
                }
            }
        });
    } else {
        return false;
    }

    return true;
});
