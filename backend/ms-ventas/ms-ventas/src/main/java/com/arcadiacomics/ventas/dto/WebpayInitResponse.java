package com.arcadiacomics.ventas.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class WebpayInitResponse {

    @JsonProperty("token")
    private String token;

    @JsonProperty("url")
    private String url;

    public WebpayInitResponse() {
    }

    public WebpayInitResponse(String token, String url) {
        this.token = token;
        this.url = url;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
