"""
Comprehensive Backend Testing Suite
Tests all endpoints, validation, business logic, and edge cases
"""

import requests
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any

BASE_URL = "http://localhost:8000"
bugs = []
test_results = []

class TestResult:
    def __init__(self, category: str, test_name: str, passed: bool, message: str = ""):
        self.category = category
        self.test_name = test_name
        self.passed = passed
        self.message = message
        self.timestamp = datetime.now()

def log_bug(bug_id: str, severity: str, endpoint: str, expected: str, actual: str, 
            steps: List[str], error: str = "", impact: str = "", fix: str = ""):
    """Log a bug with detailed information"""
    bug = {
        "id": bug_id,
        "severity": severity,
        "endpoint": endpoint,
        "expected": expected,
        "actual": actual,
        "steps": steps,
        "error": error,
        "impact": impact,
        "suggested_fix": fix,
        "timestamp": datetime.now().isoformat()
    }
    bugs.append(bug)
    print(f"  🐛 {bug_id}: {endpoint} - {severity}")

def log_test(category: str, name: str, passed: bool, message: str = ""):
    """Log a test result"""
    result = TestResult(category, name, passed, message)
    test_results.append(result)
    status = "[PASS]" if passed else "[FAIL]"
    print(f"  {status} {name}")
    if message:
        print(f"     {message}")

def safe_request(method: str, url: str, **kwargs):
    """Make request and handle exceptions"""
    try:
        if method == "GET":
            return requests.get(url, **kwargs)
        elif method == "POST":
            return requests.post(url, **kwargs)
        elif method == "PATCH":
            return requests.patch(url, **kwargs)
        elif method == "PUT":
            return requests.put(url, **kwargs)
        elif method == "DELETE":
            return requests.delete(url, **kwargs)
    except Exception as e:
        return None

# ============================================================================
# 1. STATUS ENDPOINTS
# ============================================================================
def test_status_endpoints():
    print("\n" + "="*70)
    print("1. STATUS ENDPOINTS")
    print("="*70)
    
    # Test health check
    response = safe_request("GET", f"{BASE_URL}/api/status/health")
    if response and response.status_code == 200:
        data = response.json()
        if data.get("status") == "healthy" and data.get("mock_mode") == True:
            log_test("Status", "Health check", True)
        else:
            log_test("Status", "Health check", False, f"Unexpected data: {data}")
            log_bug("BUG-001", "Medium", "GET /api/status/health", 
                   "status=healthy, mock_mode=true", f"Got: {data}",
                   ["1. GET /api/status/health"], impact="Monitoring")
    else:
        log_test("Status", "Health check", False, "Endpoint not responding")
        log_bug("BUG-002", "Critical", "GET /api/status/health",
               "200 OK response", f"Got: {response.status_code if response else 'No response'}",
               ["1. GET /api/status/health"], impact="System monitoring broken")
    
    # Test mode endpoint
    response = safe_request("GET", f"{BASE_URL}/api/status/mode")
    if response and response.status_code == 200:
        log_test("Status", "Mode check", True)
    else:
        log_test("Status", "Mode check", False)
        log_bug("BUG-003", "Low", "GET /api/status/mode",
               "200 OK", f"Got: {response.status_code if response else 'No response'}",
               ["1. GET /api/status/mode"], impact="Mode visibility")
    
    # Test costs endpoint
    response = safe_request("GET", f"{BASE_URL}/api/status/costs")
    if response and response.status_code == 200:
        data = response.json()
        if data.get("total_cost") == 0.0 and data.get("mock_mode") == True:
            log_test("Status", "Costs tracking", True)
        else:
            log_test("Status", "Costs tracking", False, f"Non-zero costs in mock mode: {data}")
            log_bug("BUG-004", "High", "GET /api/status/costs",
                   "total_cost=0.0 in mock mode", f"Got: {data.get('total_cost')}",
                   ["1. GET /api/status/costs"], 
                   impact="Billing could be incorrect",
                   fix="Ensure mock services don't increment costs")
    else:
        log_test("Status", "Costs tracking", False)

# ============================================================================
# 2. USER ENDPOINTS
# ============================================================================
def test_user_endpoints():
    print("\n" + "="*70)
    print("2. USER ENDPOINTS")
    print("="*70)
    
    # Test get current user (should auto-create)
    response = safe_request("GET", f"{BASE_URL}/api/users/me")
    user_id = None
    if response and response.status_code == 200:
        data = response.json()
        user_id = data.get("id")
        if data.get("username") == "testuser":
            log_test("Users", "Get current user", True)
        else:
            log_test("Users", "Get current user", False, f"Wrong user: {data.get('username')}")
    else:
        log_test("Users", "Get current user", False, f"Status: {response.status_code if response else 'No response'}")
        log_bug("BUG-005", "Critical", "GET /api/users/me",
               "200 OK with user data", f"Got: {response.status_code if response else 'No response'}",
               ["1. GET /api/users/me"], 
               impact="Authentication broken",
               fix="Check auth.py get_current_user() function")
    
    # Test get quota
    response = safe_request("GET", f"{BASE_URL}/api/users/me/quota")
    if response and response.status_code == 200:
        data = response.json()
        if data.get("tier") == "free" and "limits" in data:
            log_test("Users", "Get quota", True)
        else:
            log_test("Users", "Get quota", False, f"Invalid quota data: {data}")
    else:
        log_test("Users", "Get quota", False)
        log_bug("BUG-006", "Medium", "GET /api/users/me/quota",
               "200 OK with quota limits", f"Got: {response.status_code if response else 'No response'}",
               ["1. GET /api/users/me/quota"], impact="Quota enforcement broken")
    
    # Test update profile
    response = safe_request("PATCH", f"{BASE_URL}/api/users/me",
                          json={"display_name": "Updated Test User"})
    if response and response.status_code == 200:
        data = response.json()
        if data.get("display_name") == "Updated Test User":
            log_test("Users", "Update profile", True)
        else:
            log_test("Users", "Update profile", False, "Update didn't persist")
    else:
        log_test("Users", "Update profile", False)
    
    # Test get user by ID
    if user_id:
        response = safe_request("GET", f"{BASE_URL}/api/users/{user_id}")
        if response and response.status_code == 200:
            log_test("Users", "Get user by ID", True)
        else:
            log_test("Users", "Get user by ID", False)
    
    # Test invalid user ID (should 404)
    response = safe_request("GET", f"{BASE_URL}/api/users/invalid-uuid")
    if response and response.status_code in [404, 422]:
        log_test("Users", "Invalid UUID handling", True)
    else:
        log_test("Users", "Invalid UUID handling", False, f"Expected 404/422, got {response.status_code if response else 'No response'}")
        log_bug("BUG-007", "Low", "GET /api/users/{invalid-id}",
               "404 or 422 error", f"Got: {response.status_code if response else 'No response'}",
               ["1. GET /api/users/invalid-uuid"], 
               impact="Error handling inconsistent")
    
    return user_id

# ============================================================================
# 3. CAMPAIGN ENDPOINTS
# ============================================================================
def test_campaign_endpoints(user_id: str):
    print("\n" + "="*70)
    print("3. CAMPAIGN ENDPOINTS")
    print("="*70)
    
    campaign_id = None
    
    # Test create campaign - valid
    response = safe_request("POST", f"{BASE_URL}/api/campaigns",
                          json={
                              "name": "Test Campaign",
                              "description": "Integration test",
                              "visibility": "private",
                              "status": "planning"
                          })
    if response and response.status_code in [200, 201]:
        data = response.json()
        campaign_id = data.get("id")
        if data.get("dm_user_id") == user_id:
            log_test("Campaigns", "Create campaign", True)
        else:
            log_test("Campaigns", "Create campaign", False, "DM not set correctly")
            log_bug("BUG-008", "High", "POST /api/campaigns",
                   "dm_user_id should equal current user", f"Got: {data.get('dm_user_id')} vs {user_id}",
                   ["1. POST /api/campaigns with valid data"],
                   impact="Wrong DM assigned to campaigns")
    else:
        log_test("Campaigns", "Create campaign", False, f"Status: {response.status_code if response else 'No response'}")
        log_bug("BUG-009", "Critical", "POST /api/campaigns",
               "201 Created", f"Got: {response.status_code if response else 'No response'}",
               ["1. POST /api/campaigns"], impact="Cannot create campaigns")
    
    # Test create campaign - missing required fields
    response = safe_request("POST", f"{BASE_URL}/api/campaigns", json={"name": "Missing fields"})
    if response and response.status_code == 422:
        log_test("Campaigns", "Validation - missing fields", True)
    else:
        log_test("Campaigns", "Validation - missing fields", False)
        log_bug("BUG-010", "Medium", "POST /api/campaigns",
               "422 Validation Error", f"Got: {response.status_code if response else 'No response'}",
               ["1. POST /api/campaigns with only name field"],
               impact="Validation not enforcing required fields")
    
    # Test get my campaigns
    response = safe_request("GET", f"{BASE_URL}/api/campaigns/my-campaigns")
    if response and response.status_code == 200:
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            log_test("Campaigns", "Get my campaigns", True)
        else:
            log_test("Campaigns", "Get my campaigns", False, "No campaigns returned")
    else:
        log_test("Campaigns", "Get my campaigns", False)
    
    # Test get campaign by ID
    if campaign_id:
        response = safe_request("GET", f"{BASE_URL}/api/campaigns/{campaign_id}")
        if response and response.status_code == 200:
            log_test("Campaigns", "Get campaign by ID", True)
        else:
            log_test("Campaigns", "Get campaign by ID", False)
        
        # Test update campaign
        response = safe_request("PATCH", f"{BASE_URL}/api/campaigns/{campaign_id}",
                              json={"name": "Updated Campaign Name"})
        if response and response.status_code == 200:
            data = response.json()
            if data.get("name") == "Updated Campaign Name":
                log_test("Campaigns", "Update campaign", True)
            else:
                log_test("Campaigns", "Update campaign", False, "Update didn't persist")
        else:
            log_test("Campaigns", "Update campaign", False)
    
    # Test list public campaigns
    response = safe_request("GET", f"{BASE_URL}/api/campaigns")
    if response and response.status_code == 200:
        log_test("Campaigns", "List campaigns", True)
    else:
        log_test("Campaigns", "List campaigns", False)
    
    # Test invalid campaign ID
    response = safe_request("GET", f"{BASE_URL}/api/campaigns/invalid-uuid")
    if response and response.status_code in [404, 422]:
        log_test("Campaigns", "Invalid campaign ID handling", True)
    else:
        log_test("Campaigns", "Invalid campaign ID handling", False)
    
    return campaign_id

# ============================================================================
# 4. CHARACTER ENDPOINTS
# ============================================================================
def test_character_endpoints(campaign_id: str):
    print("\n" + "="*70)
    print("4. CHARACTER ENDPOINTS")
    print("="*70)
    
    character_id = None
    
    if not campaign_id:
        print("  ⚠️  Skipping character tests - no campaign available")
        return None
    
    # Test create character - valid
    response = safe_request("POST", f"{BASE_URL}/api/characters",
                          json={
                              "name": "Test Hero",
                              "campaign_id": campaign_id,
                              "race": "Human",
                              "character_class": "Fighter",
                              "level": 1,
                              "max_hp": 12,
                              "current_hp": 12,
                              "armor_class": 16,
                              "character_type": "player"
                          })
    if response and response.status_code in [200, 201]:
        data = response.json()
        character_id = data.get("id")
        log_test("Characters", "Create character", True)
    else:
        log_test("Characters", "Create character", False, f"Status: {response.status_code if response else 'No response'}")
        if response:
            log_bug("BUG-011", "Critical", "POST /api/characters",
                   "201 Created", f"Got: {response.status_code}, Error: {response.text}",
                   ["1. POST /api/characters with valid data"],
                   impact="Cannot create characters")
    
    # Test create character - missing required fields
    response = safe_request("POST", f"{BASE_URL}/api/characters",
                          json={"name": "No Campaign", "level": 1})
    if response and response.status_code == 422:
        log_test("Characters", "Validation - missing campaign_id", True)
    else:
        log_test("Characters", "Validation - missing campaign_id", False)
    
    # Test get character by ID
    if character_id:
        response = safe_request("GET", f"{BASE_URL}/api/characters/{character_id}")
        if response and response.status_code == 200:
            log_test("Characters", "Get character by ID", True)
        else:
            log_test("Characters", "Get character by ID", False)
        
        # Test update character
        response = safe_request("PATCH", f"{BASE_URL}/api/characters/{character_id}",
                              json={"level": 2, "experience_points": 300})
        if response and response.status_code == 200:
            data = response.json()
            if data.get("level") == 2:
                log_test("Characters", "Update character", True)
            else:
                log_test("Characters", "Update character", False, "Update didn't persist")
        else:
            log_test("Characters", "Update character", False)
        
        # Test apply damage (reset HP first to ensure clean state)
        safe_request("PATCH", f"{BASE_URL}/api/characters/{character_id}",
                   json={"current_hp": 12})
        response = safe_request("POST", f"{BASE_URL}/api/characters/{character_id}/damage",
                              params={"damage": 5})
        if response and response.status_code == 200:
            data = response.json()
            if data.get("current_hp") == 7:  # 12 - 5 = 7
                log_test("Characters", "Apply damage", True)
            else:
                log_test("Characters", "Apply damage", False, f"HP calculation wrong: {data.get('current_hp')}")
                log_bug("BUG-012", "High", "POST /api/characters/{id}/damage",
                       "HP reduced by damage amount", f"Expected 7, got {data.get('current_hp')}",
                       ["1. Create character with 12 HP", "2. Apply 5 damage"],
                       impact="Combat mechanics broken",
                       fix="Check damage calculation in characters.py")
        else:
            log_test("Characters", "Apply damage", False)
        
        # Test apply healing
        response = safe_request("POST", f"{BASE_URL}/api/characters/{character_id}/heal",
                              params={"healing": 3})
        if response and response.status_code == 200:
            data = response.json()
            expected_hp = min(12, 7 + 3)  # Should be 10
            if data.get("current_hp") == expected_hp:
                log_test("Characters", "Apply healing", True)
            else:
                log_test("Characters", "Apply healing", False, f"HP: {data.get('current_hp')}")
        else:
            log_test("Characters", "Apply healing", False)
        
        # Test healing beyond max HP
        response = safe_request("POST", f"{BASE_URL}/api/characters/{character_id}/heal",
                              params={"healing": 100})
        if response and response.status_code == 200:
            data = response.json()
            if data.get("current_hp") <= data.get("max_hp"):
                log_test("Characters", "Healing cap at max HP", True)
            else:
                log_test("Characters", "Healing cap at max HP", False)
                log_bug("BUG-013", "Medium", "POST /api/characters/{id}/heal",
                       "HP capped at max_hp", f"HP exceeded max: {data.get('current_hp')} > {data.get('max_hp')}",
                       ["1. Heal character for 100 HP"],
                       impact="Characters can have invalid HP",
                       fix="Ensure healing respects max_hp cap")
        else:
            log_test("Characters", "Healing cap at max HP", False)
    
    # Test get campaign characters
    response = safe_request("GET", f"{BASE_URL}/api/characters/campaign/{campaign_id}")
    if response and response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            log_test("Characters", "Get campaign characters", True)
        else:
            log_test("Characters", "Get campaign characters", False, "Not a list")
    else:
        log_test("Characters", "Get campaign characters", False)
    
    return character_id

# ============================================================================
# 5. DM ENDPOINTS
# ============================================================================
def test_dm_endpoints():
    print("\n" + "="*70)
    print("5. DM AGENT ENDPOINTS")
    print("="*70)
    
    # Test DM test endpoint
    response = safe_request("GET", f"{BASE_URL}/api/dm/test")
    if response and response.status_code == 200:
        data = response.json()
        if "message" in data and data.get("mock_mode") == True:
            log_test("DM", "Test endpoint", True)
        else:
            log_test("DM", "Test endpoint", False, f"Unexpected response: {data}")
    else:
        log_test("DM", "Test endpoint", False)
    
    # Test DM respond
    response = safe_request("POST", f"{BASE_URL}/api/dm/respond",
                          json={
                              "player_input": "I enter the tavern",
                              "campaign_name": "Test Campaign"
                          })
    if response and response.status_code == 200:
        data = response.json()
        if "narrative" in data and isinstance(data["narrative"], str):
            log_test("DM", "Generate narrative response", True)
        else:
            log_test("DM", "Generate narrative response", False, f"Missing narrative: {data}")
            log_bug("BUG-014", "High", "POST /api/dm/respond",
                   "Response with narrative field", f"Got: {data}",
                   ["1. POST /api/dm/respond with player_input"],
                   impact="DM agent broken",
                   fix="Check mock_openai_service.py")
    else:
        log_test("DM", "Generate narrative response", False)
    
    # Test generate NPC
    response = safe_request("POST", f"{BASE_URL}/api/dm/generate-npc",
                          params={"npc_name": "Barkeep", "npc_role": "innkeeper"})
    if response and response.status_code == 200:
        data = response.json()
        if "npc_details" in data:
            log_test("DM", "Generate NPC", True)
        else:
            log_test("DM", "Generate NPC", False)
    else:
        log_test("DM", "Generate NPC", False)
    
    # Test DM stats
    response = safe_request("GET", f"{BASE_URL}/api/dm/stats")
    if response and response.status_code == 200:
        data = response.json()
        if "total_requests" in data:
            log_test("DM", "Get DM stats", True)
        else:
            log_test("DM", "Get DM stats", False)
    else:
        log_test("DM", "Get DM stats", False)

# ============================================================================
# 6. DICE ENDPOINTS
# ============================================================================
def test_dice_endpoints():
    print("\n" + "="*70)
    print("6. DICE ROLLING ENDPOINTS")
    print("="*70)
    
    # Test single dice roll
    response = safe_request("POST", f"{BASE_URL}/api/dice/roll",
                          json={"notation": "1d20"})
    if response and response.status_code == 200:
        data = response.json()
        if "total" in data and "notation" in data and 1 <= data["total"] <= 20:
            log_test("Dice", "Roll single die", True)
        else:
            log_test("Dice", "Roll single die", False, f"Invalid roll: {data}")
            log_bug("BUG-015", "Medium", "POST /api/dice/roll",
                   "Valid dice roll result", f"Got: {data}",
                   ["1. POST /api/dice/roll with 1d20"],
                   impact="Dice rolling broken")
    else:
        log_test("Dice", "Roll single die", False)
    
    # Test dice with modifier
    response = safe_request("POST", f"{BASE_URL}/api/dice/roll",
                          json={"notation": "1d20+5"})
    if response and response.status_code == 200:
        data = response.json()
        if 6 <= data.get("total", 0) <= 25:
            log_test("Dice", "Roll with modifier", True)
        else:
            log_test("Dice", "Roll with modifier", False, f"Out of range: {data}")
    else:
        log_test("Dice", "Roll with modifier", False)
    
    # Test multiple dice
    response = safe_request("POST", f"{BASE_URL}/api/dice/roll",
                          json={"notation": "3d6"})
    if response and response.status_code == 200:
        data = response.json()
        if 3 <= data.get("total", 0) <= 18:
            log_test("Dice", "Roll multiple dice", True)
        else:
            log_test("Dice", "Roll multiple dice", False)
    else:
        log_test("Dice", "Roll multiple dice", False)
    
    # Test invalid notation
    response = safe_request("POST", f"{BASE_URL}/api/dice/roll",
                          json={"notation": "invalid"})
    if response and response.status_code in [400, 422]:
        log_test("Dice", "Invalid notation handling", True)
    else:
        log_test("Dice", "Invalid notation handling", False)

# ============================================================================
# 7. EDGE CASES & ERROR HANDLING
# ============================================================================
def test_edge_cases():
    print("\n" + "="*70)
    print("7. EDGE CASES & ERROR HANDLING")
    print("="*70)
    
    # Test SQL injection attempt
    response = safe_request("POST", f"{BASE_URL}/api/campaigns",
                          json={
                              "name": "'; DROP TABLE users; --",
                              "description": "SQL injection test",
                              "visibility": "private",
                              "status": "planning"
                          })
    if response and response.status_code in [200, 201]:
        # If it succeeds, check if database still works
        response2 = safe_request("GET", f"{BASE_URL}/api/users/me")
        if response2 and response2.status_code == 200:
            log_test("Security", "SQL injection protection", True)
        else:
            log_test("Security", "SQL injection protection", False, "Database corrupted!")
            log_bug("BUG-016", "Critical", "POST /api/campaigns",
                   "SQL injection blocked", "Database affected by injection",
                   ["1. POST campaign with SQL in name"],
                   impact="SECURITY VULNERABILITY - SQL Injection",
                   fix="Use parameterized queries (SQLAlchemy ORM should handle this)")
    else:
        log_test("Security", "SQL injection protection", True, "Rejected")
    
    # Test XSS attempt
    response = safe_request("POST", f"{BASE_URL}/api/campaigns",
                          json={
                              "name": "<script>alert('XSS')</script>",
                              "description": "XSS test",
                              "visibility": "private",
                              "status": "planning"
                          })
    if response and response.status_code in [200, 201]:
        data = response.json()
        if "<script>" in data.get("name", ""):
            log_test("Security", "XSS stored without sanitization", False)
            log_bug("BUG-017", "High", "POST /api/campaigns",
                   "Script tags sanitized", "Script tags stored as-is",
                   ["1. POST campaign with <script> tag"],
                   impact="XSS vulnerability",
                   fix="Sanitize user input or escape in frontend")
        else:
            log_test("Security", "XSS protection", True)
    
    # Test very long string
    response = safe_request("POST", f"{BASE_URL}/api/campaigns",
                          json={
                              "name": "A" * 10000,
                              "description": "Long string test",
                              "visibility": "private",
                              "status": "planning"
                          })
    if response and response.status_code in [422, 400]:
        log_test("Validation", "Long string rejection", True)
    else:
        log_test("Validation", "Long string rejection", False, "Accepted 10k char name")
        log_bug("BUG-018", "Medium", "POST /api/campaigns",
               "Name length validation", "Accepted 10k character name",
               ["1. POST campaign with 10k char name"],
               impact="Database bloat, DoS potential",
               fix="Add max length validation to schemas")
    
    # Test negative values where not allowed
    response = safe_request("POST", f"{BASE_URL}/api/characters",
                          json={
                              "name": "Test",
                              "campaign_id": str(uuid.uuid4()),
                              "level": -1,
                              "max_hp": -10
                          })
    if response and response.status_code in [422, 400]:
        log_test("Validation", "Negative value rejection", True)
    else:
        log_test("Validation", "Negative value rejection", False)

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def run_all_tests():
    print("\n" + "="*70)
    print("ROLLSCAPE COMPREHENSIVE TEST SUITE")
    print("="*70)
    print(f"Testing: {BASE_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    # Run all test categories
    test_status_endpoints()
    user_id = test_user_endpoints()
    campaign_id = test_campaign_endpoints(user_id)
    character_id = test_character_endpoints(campaign_id)
    test_dm_endpoints()
    test_dice_endpoints()
    test_edge_cases()
    
    # Generate summary
    print("\n" + "="*70)
    print("📊 TEST RESULTS SUMMARY")
    print("="*70)
    
    total_tests = len(test_results)
    passed_tests = sum(1 for t in test_results if t.passed)
    failed_tests = total_tests - passed_tests
    
    print(f"\nTotal Tests: {total_tests}")
    print(f"[PASS] Passed: {passed_tests} ({passed_tests/total_tests*100:.1f}%)")
    print(f"[FAIL] Failed: {failed_tests} ({failed_tests/total_tests*100:.1f}%)")
    
    print(f"\n[BUGS] Bugs Found: {len(bugs)}")
    
    if bugs:
        severity_counts = {}
        for bug in bugs:
            sev = bug["severity"]
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
        
        print("\nBy Severity:")
        for severity in ["Critical", "High", "Medium", "Low"]:
            count = severity_counts.get(severity, 0)
            if count > 0:
                print(f"  {severity}: {count}")
    
    # Category breakdown
    print("\nBy Category:")
    categories = {}
    for result in test_results:
        cat = result.category
        if cat not in categories:
            categories[cat] = {"passed": 0, "failed": 0}
        if result.passed:
            categories[cat]["passed"] += 1
        else:
            categories[cat]["failed"] += 1
    
    for cat, counts in categories.items():
        total = counts["passed"] + counts["failed"]
        pct = counts["passed"] / total * 100
        status = "[PASS]" if counts["failed"] == 0 else "[FAIL]"
        print(f"  {status} {cat}: {counts['passed']}/{total} ({pct:.0f}%)")
    
    print("\n" + "="*70)
    
    # Save detailed bug report
    if bugs:
        save_bug_report()
    
    # Save test results
    save_test_results()
    
    return passed_tests, failed_tests, bugs

def save_bug_report():
    """Save detailed bug report to file"""
    with open("BUG_REPORT.md", "w") as f:
        f.write("# RollScape Bug Report\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**Total Bugs Found:** {len(bugs)}\n\n")
        
        # Group by severity
        for severity in ["Critical", "High", "Medium", "Low"]:
            sev_bugs = [b for b in bugs if b["severity"] == severity]
            if sev_bugs:
                f.write(f"## {severity} Priority\n\n")
                for bug in sev_bugs:
                    f.write(f"### {bug['id']}: {bug['endpoint']}\n\n")
                    f.write(f"**Severity:** {bug['severity']}\n\n")
                    f.write(f"**Expected:** {bug['expected']}\n\n")
                    f.write(f"**Actual:** {bug['actual']}\n\n")
                    f.write(f"**Steps to Reproduce:**\n")
                    for i, step in enumerate(bug['steps'], 1):
                        f.write(f"{i}. {step}\n")
                    f.write(f"\n")
                    if bug['error']:
                        f.write(f"**Error:** {bug['error']}\n\n")
                    if bug['impact']:
                        f.write(f"**Impact:** {bug['impact']}\n\n")
                    if bug['suggested_fix']:
                        f.write(f"**Suggested Fix:** {bug['suggested_fix']}\n\n")
                    f.write("---\n\n")
    
    print(f"\n[SUCCESS] Bug report saved to BUG_REPORT.md")

def save_test_results():
    """Save test results to JSON"""
    results_data = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total": len(test_results),
            "passed": sum(1 for t in test_results if t.passed),
            "failed": sum(1 for t in test_results if not t.passed),
            "bugs_found": len(bugs)
        },
        "tests": [
            {
                "category": t.category,
                "name": t.test_name,
                "passed": t.passed,
                "message": t.message,
                "timestamp": t.timestamp.isoformat()
            }
            for t in test_results
        ],
        "bugs": bugs
    }
    
    with open("test_results.json", "w") as f:
        json.dump(results_data, f, indent=2)
    
    print(f"[SUCCESS] Test results saved to test_results.json")

if __name__ == "__main__":
    try:
        passed, failed, bugs_found = run_all_tests()
        
        if failed == 0 and len(bugs_found) == 0:
            print("\n🎉 ALL TESTS PASSED! NO BUGS FOUND!")
            exit(0)
        else:
            print(f"\n⚠️  Testing complete with {failed} failures and {len(bugs_found)} bugs")
            exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Testing interrupted by user")
        exit(2)
    except Exception as e:
        print(f"\n\n[ERROR] Testing failed with error: {e}")
        import traceback
        traceback.print_exc()
        exit(3)
