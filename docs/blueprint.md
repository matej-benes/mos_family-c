# **App Name**: MikyOS Family Connect

## Core Features:

- Offline P2P Calling: Enables direct device-to-device voice communication without internet, leveraging WebRTC and BLE for device discovery and connection within a specified range. Calls use local Firestore cache for signaling.
- Role-Based Access Control: Implements a system with 'superadmin', 'starší' (older), and 'mladší' (younger) roles, managed via Firebase Auth custom claims. Restricts access to features and settings based on user role. Can assign roles using setCustomUserClaims.
- Game Mode Activation: Allows a superadmin to toggle a 'game mode' that enables or disables access to the OS features, and monitors game state changes in Firestore.
- Bedtime Feature: Lets an admin user configure a bedtime that restricts OS access for specified users. Leverages device-specific bedtime settings stored in Firestore.
- App and Contact Approval: Provides parental control functionality, allowing 'starší' users to approve app usage and contacts for 'mladší' users. Updates are managed via Firestore.
- Lock Screen: Displays a lock screen based on game mode status or bedtime settings. The content shows a custom message.
- UI Generation: Use AI tool to generate UI code for new apps.

## Style Guidelines:

- Primary color: Soft blue (#A0D2EB) to create a calming, trustworthy feel appropriate for family use.
- Background color: Very light blue (#F0F8FF) providing a clean, non-distracting backdrop.
- Accent color: Pale purple (#D1B3C4), used to highlight interactive elements and calls to action without overwhelming the user.
- Body and headline font: 'PT Sans', a humanist sans-serif font.
- Use simple, clear icons representing apps and functions; the style should be consistent with a kid-friendly OS.
- Emphasize a clear, intuitive layout, especially on the home screen. Organize apps and contacts in a grid, designed for easy navigation.
- Use gentle, non-intrusive animations for transitions and feedback, adding a touch of delight without distracting the user.