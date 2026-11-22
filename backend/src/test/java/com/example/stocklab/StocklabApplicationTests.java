package com.example.stocklab;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Integracijski test: zažene celoten kontekst proti pravi bazi iz application-local.properties.
 * V CI te datoteke ni (gesla niso v gitu), zato se test tam preskoči.
 */
@SpringBootTest
@ActiveProfiles("local")
@EnabledIf("imaLokalnoKonfiguracijo")
class StocklabApplicationTests {

	static boolean imaLokalnoKonfiguracijo() {
		return StocklabApplicationTests.class.getResource("/application-local.properties") != null;
	}

	@Test
	void contextLoads() {
	}
}
