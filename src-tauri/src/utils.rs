pub fn is_app_elevated_for_current_os() -> bool {
    #[cfg(target_os = "windows")]
    {
        // Only compiled on Windows
        crate::windows::win::is_app_elevated()
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Non-windows fallback
        false
    }
}
