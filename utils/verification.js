function resolveVerificationFlags(entity = {}) {
    const actualVerified = !!entity?.verified;
    const verificationVisible = entity?.verificationVisible !== false;
    return {
        actualVerified,
        verificationVisible,
        displayVerified: actualVerified && verificationVisible
    };
}

function withVerification(entity, options = {}) {
    if (!entity) return entity;
    const flags = resolveVerificationFlags(entity);
    const includeActual = options.includeActual !== false;
    const includeDisplay = options.includeDisplay !== false;
    const includeVisibility = options.includeVisibility !== false;

    const base = typeof entity.toObject === 'function'
        ? entity.toObject({ versionKey: false })
        : { ...entity };

    if (includeActual) {
        base.actualVerified = flags.actualVerified;
    }

    if (includeVisibility) {
        base.verificationVisible = flags.verificationVisible;
    }

    if (includeDisplay) {
        base.displayVerified = flags.displayVerified;
        base.verified = flags.displayVerified;
    }

    return base;
}

module.exports = {
    resolveVerificationFlags,
    withVerification
};
