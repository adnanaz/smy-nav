<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <div class="text-center">
          <v-icon size="120" color="error">mdi-alert-circle</v-icon>
          <h1 class="text-h3 mt-4 mb-2">404 - Page Not Found</h1>
          <p class="text-h6 text-medium-emphasis mb-6">
            The page you are looking for does not exist.
          </p>
          <v-btn color="primary" size="large" @click="$router.push('/')">
            Go Home
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>