#!/bin/bash
set -e

SUITE="${TEST_SUITE:-smoke}"
PLATFORM="${PLATFORM:-android}"
RESULTS_DIR="/app/allure-results"
REPORT_DIR="/app/allure-report"
S3_BUCKET="${S3_REPORT_BUCKET:-pairmaker-test-reports}"
RUN_ID="${RUN_ID:-$(date +%Y%m%d_%H%M%S)}"

echo "=== PairMaker ECS Test Runner ==="
echo "Suite:    $SUITE"
echo "Platform: $PLATFORM"
echo "Run ID:   $RUN_ID"
echo "================================="

mkdir -p "$RESULTS_DIR" "$REPORT_DIR"

# Start Appium server in background
appium --relaxed-security &
APPIUM_PID=$!
sleep 3

# Run tests
case "$SUITE" in
  smoke)
    npx wdio run tests/appium/wdio.conf.ts --spec "tests/appium/smoke/*.test.ts"
    ;;
  regression)
    npx wdio run tests/appium/wdio.conf.ts --spec "tests/appium/regression/*.test.ts"
    ;;
  hotfix)
    npx wdio run tests/appium/wdio.conf.ts --spec "tests/appium/hotfix/*.test.ts"
    ;;
  api)
    npx vitest run --config tests/api/vitest.config.ts
    ;;
  *)
    echo "Unknown suite: $SUITE" >&2
    exit 1
    ;;
esac

TEST_EXIT=$?

# Kill Appium
kill $APPIUM_PID 2>/dev/null || true

# Generate Allure report
if [ "$SUITE" != "api" ]; then
  allure generate "$RESULTS_DIR" --clean -o "$REPORT_DIR"
fi

# Upload to S3
if command -v aws &> /dev/null; then
  aws s3 sync "$REPORT_DIR" "s3://${S3_BUCKET}/reports/${RUN_ID}/" --acl public-read
  echo "Report uploaded: https://${S3_BUCKET}.s3.amazonaws.com/reports/${RUN_ID}/index.html"
fi

exit $TEST_EXIT
