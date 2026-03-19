package com.sdet.api.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * POJO for User entity — matches JSONPlaceholder's /users response shape.
 *
 * @JsonIgnoreProperties(ignoreUnknown = true):
 * JSONPlaceholder returns nested objects (address, company) that we don't
 * need for most tests. This annotation tells Jackson to skip unknown fields
 * instead of throwing an error. Without it, deserialization would fail
 * because our POJO doesn't have an "address" field.
 *
 * This is a VERY common pattern in API testing — you rarely model the
 * entire response. Model what you assert on, ignore the rest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class User {
    private Integer id;
    private String name;
    private String username;
    private String email;
    private String phone;
    private String website;
}
