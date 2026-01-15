# TODO


- [ ] 2026/1/14
    - [x] 登录成功应 supabase.auth
    - [ ] debug使用supabase自带的模拟邮件发送（而不是在控制台输出）
    - [√] 测试模块优化 (内容+输出)
- [ ] 2026/1/15
    - [ ] 发送邮件验证码的 注册/登录 
        - 发送验证码 supabase.auth.signInWithOtp
        - 验证验证码 supabase.auth.verifyOtp
    - [ ] 发送链接邮件的 注册/登录
    - [ ] 验证帐号和密码 supabase.auth.signInWithPassword
    - [ ] 测试模块应该一个ts文件只测试一个接口, 包含该接口的各种情况
    - [ ] 记录说明文档和AI工作的范本文档
    - [ ] 部署前项项目
    - [ ] 部署项目调用API项目