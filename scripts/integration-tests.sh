#!/bin/bash
# 🔗 INTEGRATION TESTS
# Tests end-to-end functionality across all services

set -e

echo "🔗 Starting Integration Tests..."
echo "==============================="

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test configuration
API_BASE="http://localhost:8080/api"
TEST_USER_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"
AUTH_TOKEN=""

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_integration_test() {
    local test_name="$1"
    local test_function="$2"
    
    echo -e "${BLUE}🧪 Testing: $test_name${NC}"
    ((TOTAL_TESTS++))
    
    if $test_function; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Helper function to make API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            ${headers:+-H "$headers"} \
            -d "$data"
    else
        curl -s -X "$method" "$API_BASE$endpoint" \
            ${headers:+-H "$headers"}
    fi
}

# Test 1: Service Health Checks
test_service_health() {
    local services=("auth" "community" "link" "chat" "news" "admin")
    
    for service in "${services[@]}"; do
        local response=$(curl -s -w "%{http_code}" "$API_BASE/$service/health")
        local http_code="${response: -3}"
        
        if [ "$http_code" != "200" ]; then
            echo "Service $service health check failed (HTTP $http_code)"
            return 1
        fi
    done
    
    return 0
}

# Test 2: User Registration
test_user_registration() {
    local response=$(api_call "POST" "/auth/register" \
        "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}")
    
    if echo "$response" | grep -q '"success":true'; then
        return 0
    else
        echo "Registration failed: $response"
        return 1
    fi
}

# Test 3: User Login
test_user_login() {
    local response=$(api_call "POST" "/auth/login" \
        "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if echo "$response" | grep -q '"success":true'; then
        # Extract token for subsequent tests
        AUTH_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$AUTH_TOKEN" ]; then
            return 0
        fi
    fi
    
    echo "Login failed: $response"
    return 1
}

# Test 4: Rate Limiting
test_rate_limiting() {
    local failed_count=0
    
    # Make 6 failed login attempts
    for i in {1..6}; do
        local response=$(api_call "POST" "/auth/login" \
            "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"wrongpassword\"}")
        
        if echo "$response" | grep -q "rate.*limit\|too.*many"; then
            return 0
        fi
    done
    
    echo "Rate limiting not working"
    return 1
}

# Test 5: Protected Endpoint Access
test_protected_endpoint() {
    # Test without token (should fail)
    local response=$(api_call "GET" "/users/dashboard")
    if ! echo "$response" | grep -q '"success":false\|401\|unauthorized'; then
        echo "Protected endpoint accessible without token"
        return 1
    fi
    
    # Test with token (should succeed)
    local response=$(api_call "GET" "/users/dashboard" "" "Authorization: Bearer $AUTH_TOKEN")
    if echo "$response" | grep -q '"success":true'; then
        return 0
    else
        echo "Protected endpoint not accessible with valid token: $response"
        return 1
    fi
}

# Test 6: Create Post
test_create_post() {
    local post_data="{\"title\":\"Integration Test Post\",\"content\":\"This is a test post for integration testing\",\"category\":\"general\"}"
    local response=$(api_call "POST" "/community/posts" "$post_data" "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q '"success":true'; then
        # Extract post ID for later tests
        POST_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        return 0
    else
        echo "Post creation failed: $response"
        return 1
    fi
}

# Test 7: Get Posts
test_get_posts() {
    local response=$(api_call "GET" "/community/posts")
    
    if echo "$response" | grep -q '"success":true' && echo "$response" | grep -q '"data"'; then
        return 0
    else
        echo "Get posts failed: $response"
        return 1
    fi
}

# Test 8: Input Validation
test_input_validation() {
    # Test with malicious input
    local malicious_data="{\"title\":\"<script>alert('xss')</script>\",\"content\":\"javascript:alert(1)\"}"
    local response=$(api_call "POST" "/community/posts" "$malicious_data" "Authorization: Bearer $AUTH_TOKEN")
    
    # Should return validation error
    if echo "$response" | grep -q '"success":false\|validation\|400'; then
        return 0
    else
        echo "Input validation not working: $response"
        return 1
    fi
}

# Test 9: Vote on Post
test_voting() {
    if [ -z "$POST_ID" ]; then
        echo "No post ID available for voting test"
        return 1
    fi
    
    local vote_data="{\"voteType\":\"upvote\"}"
    local response=$(api_call "POST" "/community/posts/$POST_ID/vote" "$vote_data" "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q '"success":true'; then
        return 0
    else
        echo "Voting failed: $response"
        return 1
    fi
}

# Test 10: Link Analysis
test_link_analysis() {
    local link_data="{\"url\":\"https://example.com\"}"
    local response=$(api_call "POST" "/link/analyze" "$link_data" "Authorization: Bearer $AUTH_TOKEN")
    
    # Should return analysis result or queue confirmation
    if echo "$response" | grep -q '"success":true\|queued\|analysis'; then
        return 0
    else
        echo "Link analysis failed: $response"
        return 1
    fi
}

# Test 11: Chat Functionality
test_chat() {
    local message_data="{\"message\":\"Hello, this is a test message\"}"
    local response=$(api_call "POST" "/chat/send" "$message_data" "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q '"success":true\|message'; then
        return 0
    else
        echo "Chat functionality failed: $response"
        return 1
    fi
}

# Test 12: News Feed
test_news_feed() {
    local response=$(api_call "GET" "/news/articles")
    
    if echo "$response" | grep -q '"success":true\|articles\|news'; then
        return 0
    else
        echo "News feed failed: $response"
        return 1
    fi
}

# Test 13: Search Functionality
test_search() {
    local response=$(api_call "GET" "/community/posts?search=test")
    
    if echo "$response" | grep -q '"success":true'; then
        return 0
    else
        echo "Search functionality failed: $response"
        return 1
    fi
}

# Test 14: Pagination
test_pagination() {
    local response=$(api_call "GET" "/community/posts?page=1&limit=5")
    
    if echo "$response" | grep -q '"pagination"\|"page"\|"limit"'; then
        return 0
    else
        echo "Pagination failed: $response"
        return 1
    fi
}

# Test 15: Error Handling
test_error_handling() {
    # Test invalid endpoint
    local response=$(api_call "GET" "/invalid/endpoint")
    
    if echo "$response" | grep -q '"success":false\|404\|not.*found'; then
        return 0
    else
        echo "Error handling failed: $response"
        return 1
    fi
}

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Run all integration tests
echo ""
echo "🧪 Running Integration Tests..."
echo "=============================="

run_integration_test "Service Health Checks" test_service_health
run_integration_test "User Registration" test_user_registration
run_integration_test "User Login" test_user_login
run_integration_test "Rate Limiting" test_rate_limiting
run_integration_test "Protected Endpoint Access" test_protected_endpoint
run_integration_test "Create Post" test_create_post
run_integration_test "Get Posts" test_get_posts
run_integration_test "Input Validation" test_input_validation
run_integration_test "Voting Functionality" test_voting
run_integration_test "Link Analysis" test_link_analysis
run_integration_test "Chat Functionality" test_chat
run_integration_test "News Feed" test_news_feed
run_integration_test "Search Functionality" test_search
run_integration_test "Pagination" test_pagination
run_integration_test "Error Handling" test_error_handling

# Cleanup test data
echo ""
echo "🧹 Cleaning up test data..."
if [ -n "$POST_ID" ] && [ -n "$AUTH_TOKEN" ]; then
    api_call "DELETE" "/community/posts/$POST_ID" "" "Authorization: Bearer $AUTH_TOKEN" > /dev/null 2>&1
fi

# Summary
echo ""
echo "==============================="
echo "🔗 INTEGRATION TEST SUMMARY"
echo "==============================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL INTEGRATION TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ System integration is working correctly${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME INTEGRATION TESTS FAILED${NC}"
    echo -e "${YELLOW}⚠️  Please review failed tests and fix issues${NC}"
    exit 1
fi
