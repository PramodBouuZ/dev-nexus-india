import { getEmailHtml, isProfileComplete } from "./email-service";

export async function runEmailVerificationTests() {
  console.log("=== STARTING EMAIL NOTIFICATION ENHANCEMENT VERIFICATION ===");
  let failures = 0;

  // Test 1: Check Email HTML Template Content
  try {
    const developerHtml = getEmailHtml(
      "Welcome to DeveloperConnect 🚀",
      "Hi Test Dev,",
      "Welcome to DeveloperConnect!<br/><br/>Your account has been created successfully.",
      "Complete your profile by adding:",
      [
        "Profile Photo",
        "Skills",
        "Experience",
        "Portfolio",
        "Bio",
        "Availability",
        "Pricing",
        "Technologies",
      ],
      "Complete My Profile",
      "https://developerconnect.in/profile"
    );

    const requiredDevElements = [
      "Developer",
      "Connect",
      "Hi Test Dev,",
      "Welcome to DeveloperConnect!",
      "Complete My Profile",
      "https://developerconnect.in/profile",
      "Profile Photo",
      "Skills",
      "Experience",
      "Portfolio",
      "Bio",
      "Availability",
      "Pricing",
      "Technologies",
    ];

    for (const elem of requiredDevElements) {
      if (!developerHtml.includes(elem)) {
        console.error(`❌ Test 1 Failed: Developer template missing expected element: "${elem}"`);
        failures++;
      }
    }

    const recruiterHtml = getEmailHtml(
      "Welcome to DeveloperConnect 🚀",
      "Hi Test Recruiter,",
      "Welcome to DeveloperConnect!<br/><br/>Your recruiter account has been created successfully.",
      "Complete your profile by adding:",
      [
        "Company Logo",
        "Company Description",
        "Industry",
        "Website",
        "Company Details",
      ],
      "Complete Company Profile",
      "https://developerconnect.in/profile"
    );

    const requiredRecElements = [
      "Developer",
      "Connect",
      "Hi Test Recruiter,",
      "Welcome to DeveloperConnect!",
      "Complete Company Profile",
      "https://developerconnect.in/profile",
      "Company Logo",
      "Company Description",
      "Industry",
      "Website",
      "Company Details",
    ];

    for (const elem of requiredRecElements) {
      if (!recruiterHtml.includes(elem)) {
        console.error(`❌ Test 1 Failed: Recruiter template missing expected element: "${elem}"`);
        failures++;
      }
    }

    if (failures === 0) {
      console.log("✅ Test 1 Passed: Branded email HTML templates verified successfully.");
    }
  } catch (err: any) {
    console.error("❌ Test 1 Failed with error:", err);
    failures++;
  }

  // Test 2: Verify Profile Completeness logic on empty profile mock data
  try {
    const mockEmptyProfile = null;
    const mockEmptyDevProfile = null;

    // A real call to isProfileComplete with a non-existent ID should return false
    const devComplete = await isProfileComplete("00000000-0000-0000-0000-000000000000", "developer");
    const recComplete = await isProfileComplete("00000000-0000-0000-0000-000000000000", "recruiter");

    if (devComplete !== false || recComplete !== false) {
      console.error("❌ Test 2 Failed: isProfileComplete should return false for nonexistent/empty profiles.");
      failures++;
    } else {
      console.log("✅ Test 2 Passed: Profile completeness checker handles empty profiles correctly.");
    }
  } catch (err: any) {
    console.error("❌ Test 2 Failed with error:", err);
    failures++;
  }

  console.log("=== VERIFICATION SUMMARY ===");
  if (failures === 0) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ✅");
  } else {
    console.error(`🚨 ${failures} TEST(S) FAILED! ❌`);
    process.exit(1);
  }
}

// Run unconditionally when executed
runEmailVerificationTests().catch((err) => {
  console.error("Unhandled error running tests:", err);
  process.exit(1);
});
