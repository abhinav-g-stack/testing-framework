import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { getConfig } from '../../config/environments.js';
import { checkResponse, uniqueId } from '../../lib/helpers.js';

const config = getConfig();

/**
 * End-to-End User Journey for JSONPlaceholder.
 *
 * Simulates: Browse users → View user → View user's posts → Create post → Browse todos
 */

export function userJourney() {

    // Step 1: Browse user list
    group('01_Browse_Users', () => {
        const browseRes = http.get(`${config.baseUrl}/users`);
        checkResponse(browseRes, 200, 'Browse Users');

        const users = JSON.parse(browseRes.body);
        if (users && users.length > 0) {
            const randomUser = users[Math.floor(Math.random() * users.length)];

            // Step 2: View specific user
            group('02_View_User', () => {
                const viewRes = http.get(`${config.baseUrl}/users/${randomUser.id}`);
                checkResponse(viewRes, 200, 'View User');
            });

            // Step 3: View user's posts
            group('03_View_User_Posts', () => {
                const postsRes = http.get(`${config.baseUrl}/posts?userId=${randomUser.id}`);
                checkResponse(postsRes, 200, 'View User Posts');
            });
        }

        sleep(config.thinkTime);
    });

    // Step 4: Create a new post
    group('04_Create_Post', () => {
        const newPost = JSON.stringify({
            userId: 1,
            title: `PerfTest_${uniqueId()}`,
            body: 'Load testing post body',
        });

        const createRes = http.post(`${config.baseUrl}/posts`, newPost, {
            headers: { 'Content-Type': 'application/json' },
        });

        checkResponse(createRes, 201, 'Create Post');
        sleep(config.thinkTime);
    });

    // Step 5: Browse todos
    group('05_Browse_Todos', () => {
        const todoRes = http.get(`${config.baseUrl}/todos?userId=1`);
        checkResponse(todoRes, 200, 'Browse Todos');
        sleep(config.thinkTime);
    });
}
