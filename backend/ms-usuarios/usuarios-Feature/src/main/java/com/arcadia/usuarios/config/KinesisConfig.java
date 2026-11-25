package com.arcadia.usuarios.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsSessionCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.kinesis.KinesisClient;

@Configuration
public class KinesisConfig {

    @Bean(destroyMethod = "close")
    public KinesisClient kinesisClient(
            @Value("${aws.region:us-east-1}") String region,
            @Value("${aws.access-key-id:}") String accessKeyId,
            @Value("${aws.secret-access-key:}") String secretAccessKey,
            @Value("${aws.session-token:}") String sessionToken) {

        AwsCredentialsProvider credentialsProvider;
        if (accessKeyId != null && !accessKeyId.isBlank()
                && secretAccessKey != null && !secretAccessKey.isBlank()) {
            if (sessionToken != null && !sessionToken.isBlank()) {
                credentialsProvider = StaticCredentialsProvider.create(
                        AwsSessionCredentials.create(
                                accessKeyId.trim(),
                                secretAccessKey.trim(),
                                sessionToken.trim()));
            } else {
                credentialsProvider = StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(
                                accessKeyId.trim(),
                                secretAccessKey.trim()));
            }
        } else {
            credentialsProvider = DefaultCredentialsProvider.create();
        }

        return KinesisClient.builder()
                .region(Region.of(region.trim()))
                .credentialsProvider(credentialsProvider)
                .build();
    }
}
