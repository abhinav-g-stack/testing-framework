package com.sdet.api.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * POJO for Post entity — matches JSONPlaceholder's /posts response.
 * Demonstrates testing a SECOND resource type in the same framework.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Post {
    private Integer id;
    private Integer userId;
    private String title;
    private String body;
}
