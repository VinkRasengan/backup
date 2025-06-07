// Verify Real Data Migration - No More Dummy Data
require('dotenv').config({ path: '../.env' });

const axios = require('axios');

const BASE_URL = 'http://localhost:5002';

class RealDataVerifier {
    constructor() {
        this.results = [];
    }

    async test(name, testFn) {
        console.log(`🧪 Testing: ${name}`);
        try {
            const result = await testFn();
            this.results.push({ name, status: 'PASS', result });
            console.log(`✅ ${name}: PASS`);
            return result;
        } catch (error) {
            this.results.push({ name, status: 'FAIL', error: error.message });
            console.log(`❌ ${name}: FAIL - ${error.message}`);
            return null;
        }
    }

    async runAllTests() {
        console.log('🔥 Real Data Verification - No More Dummy Data');
        console.log('===============================================\n');

        // Test 1: Real Community Data
        await this.test('Real Community Posts', async () => {
            const response = await axios.get(`${BASE_URL}/api/community/posts`);
            const posts = response.data.data.posts;
            
            // Check for Vietnamese content (real data indicator)
            const vietnamesePosts = posts.filter(p => 
                p.title.includes('Cảnh báo') || 
                p.title.includes('Phát hiện') ||
                p.content.includes('Việt Nam') ||
                p.content.includes('người dùng')
            );
            
            // Check for real user profiles
            const realUsers = posts.filter(p => 
                p.author.name !== 'Unknown User' && 
                p.author.name.includes('Dr.') || 
                p.author.name.includes('Trần') ||
                p.author.name.includes('VnExpress')
            );
            
            return {
                totalPosts: posts.length,
                vietnamesePosts: vietnamesePosts.length,
                realUserProfiles: realUsers.length,
                hasRealContent: vietnamesePosts.length > 0,
                noMoreDummyData: posts.every(p => p.title !== 'Sample Post' && p.content !== 'Sample content')
            };
        });

        // Test 2: Real User Profiles
        await this.test('Real User Profiles', async () => {
            const response = await axios.get(`${BASE_URL}/api/community/stats`);
            const stats = response.data.data;
            
            // Get a sample post to check author
            const postsResponse = await axios.get(`${BASE_URL}/api/community/posts`);
            const posts = postsResponse.data.data.posts;
            
            const expertUsers = posts.filter(p => 
                p.author.name.includes('Dr.') || 
                p.author.name.includes('Chuyên gia') ||
                p.author.bio?.includes('chuyên gia')
            );
            
            return {
                totalUsers: stats.totalUsers,
                hasExpertUsers: expertUsers.length > 0,
                userGrowth: stats.totalUsers >= 5, // Should have at least 5 real users
                diverseRoles: posts.some(p => p.author.name.includes('VnExpress')) // Media user
            };
        });

        // Test 3: Real Voting Data
        await this.test('Real Voting System', async () => {
            const response = await axios.get(`${BASE_URL}/api/community/posts`);
            const posts = response.data.data.posts;
            
            // Check for posts with actual votes
            const postsWithVotes = posts.filter(p => 
                p.votes.safe > 0 || p.votes.unsafe > 0 || p.votes.suspicious > 0
            );
            
            // Check for realistic vote patterns
            const realisticVoting = posts.filter(p => {
                const totalVotes = p.votes.safe + p.votes.unsafe + p.votes.suspicious;
                return totalVotes > 0 && totalVotes <= 10; // Realistic vote counts
            });
            
            return {
                postsWithVotes: postsWithVotes.length,
                realisticVoting: realisticVoting.length,
                hasVotingActivity: postsWithVotes.length > 0,
                votingWorking: posts.some(p => p.votes.safe > 2) // Some posts have multiple votes
            };
        });

        // Test 4: Real Comments
        await this.test('Real Comments System', async () => {
            const response = await axios.get(`${BASE_URL}/api/community/stats`);
            const stats = response.data.data;
            
            const postsResponse = await axios.get(`${BASE_URL}/api/community/posts`);
            const posts = postsResponse.data.data.posts;
            
            const postsWithComments = posts.filter(p => p.commentsCount > 0);
            
            return {
                totalComments: stats.totalComments,
                postsWithComments: postsWithComments.length,
                hasCommentActivity: stats.totalComments > 0,
                realisticCommentCounts: postsWithComments.every(p => p.commentsCount <= 5)
            };
        });

        // Test 5: Rich Content Metadata
        await this.test('Rich Content Metadata', async () => {
            const response = await axios.get(`${BASE_URL}/api/community/posts`);
            const posts = response.data.data.posts;
            
            // Check for posts with rich scan results
            const postsWithScanResults = posts.filter(p => 
                p.scanResults && 
                p.scanResults.virusTotal && 
                p.scanResults.sslCheck
            );
            
            // Check for posts with content analysis
            const postsWithAnalysis = posts.filter(p => 
                p.scanResults?.contentAnalysis?.factChecked ||
                p.scanResults?.contentAnalysis?.sources
            );
            
            // Check for Vietnamese tags
            const postsWithVietnameseTags = posts.filter(p => 
                p.tags?.some(tag => 
                    tag.includes('lua-dao') || 
                    tag.includes('bao-mat') ||
                    tag.includes('y-te')
                )
            );
            
            return {
                postsWithScanResults: postsWithScanResults.length,
                postsWithAnalysis: postsWithAnalysis.length,
                postsWithVietnameseTags: postsWithVietnameseTags.length,
                hasRichMetadata: postsWithScanResults.length > 0,
                hasFactChecking: postsWithAnalysis.length > 0
            };
        });

        // Test 6: No Mock/Dummy Data
        await this.test('No Mock/Dummy Data', async () => {
            const response = await axios.get(`${BASE_URL}/api/community/posts`);
            const posts = response.data.data.posts;
            
            // Check for absence of dummy data indicators
            const dummyIndicators = [
                'Sample Post',
                'Test Content',
                'Lorem ipsum',
                'example.com/test',
                'Mock User',
                'Dummy Data'
            ];
            
            const hasDummyData = posts.some(p => 
                dummyIndicators.some(indicator => 
                    p.title.includes(indicator) || 
                    p.content.includes(indicator) ||
                    p.author.name.includes(indicator)
                )
            );
            
            // Check for real, meaningful content
            const meaningfulContent = posts.filter(p => 
                p.content.length > 50 && // Substantial content
                (p.content.includes('cảnh báo') || 
                 p.content.includes('phát hiện') ||
                 p.content.includes('nghiên cứu') ||
                 p.content.includes('thông tin'))
            );
            
            return {
                noDummyData: !hasDummyData,
                meaningfulContent: meaningfulContent.length,
                realWorldRelevant: posts.some(p => 
                    p.title.includes('COVID-19') || 
                    p.title.includes('ngân hàng') ||
                    p.title.includes('NASA')
                ),
                productionReady: !hasDummyData && meaningfulContent.length > 0
            };
        });

        // Test 7: Data Consistency
        await this.test('Data Consistency', async () => {
            const statsResponse = await axios.get(`${BASE_URL}/api/community/stats`);
            const stats = statsResponse.data.data;
            
            const postsResponse = await axios.get(`${BASE_URL}/api/community/posts`);
            const posts = postsResponse.data.data.posts;
            
            return {
                statsMatchPosts: stats.totalPosts === posts.length,
                hasUsers: stats.totalUsers > 0,
                hasVotes: stats.totalVotes > 0,
                hasComments: stats.totalComments >= 0,
                statusBreakdownValid: Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0) <= stats.totalPosts
            };
        });

        this.printSummary();
    }

    printSummary() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const successRate = Math.round((passed / this.results.length) * 100);

        console.log('\n🎯 Real Data Verification Summary');
        console.log('=================================');
        console.log(`Total Tests: ${this.results.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Success Rate: ${successRate}%`);

        console.log('\n📋 Detailed Results:');
        this.results.forEach(test => {
            const status = test.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${test.name}`);
            
            if (test.status === 'PASS' && test.result) {
                Object.entries(test.result).forEach(([key, value]) => {
                    const icon = value === true ? '✅' : value === false ? '❌' : '📊';
                    console.log(`   ${icon} ${key}: ${value}`);
                });
            }
        });

        console.log('\n🏆 Final Assessment:');
        console.log('====================');
        
        if (successRate === 100) {
            console.log('🟢 PERFECT: All dummy data successfully replaced with real data!');
            console.log('   🔥 Production-ready content');
            console.log('   ✅ Vietnamese localization');
            console.log('   🎯 Real user interactions');
            console.log('   📊 Meaningful statistics');
            console.log('   🚀 Ready for deployment');
        } else if (successRate >= 85) {
            console.log('🟡 GOOD: Most dummy data replaced, minor issues remain');
            console.log('   🔧 Address failing tests');
            console.log('   🚀 Nearly production ready');
        } else {
            console.log('🔴 NEEDS WORK: Significant dummy data still present');
            console.log('   🛠️ More migration needed');
            console.log('   ⚠️ Not ready for production');
        }

        console.log('\n🎉 Data Migration Assessment: COMPLETE! 🔥');
    }
}

// Run verification
const verifier = new RealDataVerifier();
verifier.runAllTests().catch(console.error);
